import { BadRequestException, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { catchError, lastValueFrom, map } from 'rxjs';
import { AssetType } from '../assets/types/assets';
import { PaymentStatuses } from './enums/paymentStatuses.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from './schemas/orders';
import { Model } from 'mongoose';
import { webcrypto } from 'node:crypto';
const Stripe = require('stripe');
// import * as Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private readonly paymentServiceEndpoint: URL;
  private readonly liqpay: any = {};
  private readonly stripe: any;
  private readonly defaultPrices = {};

  constructor(
    private readonly config: ConfigService,
    private httpService: HttpService,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {
    this.liqpay = {
      private: this.config.get<string>('payment.liqpay.private'),
      public: this.config.get<string>('payment.liqpay.public'),
      endpoint: this.config.get<string>('payment.liqpay.endpoint'),
    };
    this.defaultPrices = {
      gem: this.config.get<string>('payment.gem'),
      item: this.config.get<string>('payment.item'),
      avatar: this.config.get<string>('payment.avatar'),
    };
    this.paymentServiceEndpoint = new URL(this.config.get<string>('payment.endpoint'));
    this.stripe = new Stripe(this.config.get('payment.stripe.private'));
  }

  async getAssetPrice(assetType) {
    try {
      const url = `${this.paymentServiceEndpoint}assets/${assetType}/payment-info`;
      const request = this.httpService
        .get(url, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
        .pipe(
          map((res: any) => {
            return res.data.price ? res.data.price : this.defaultPrices[assetType].toString();
          }),
        );
      const result = await lastValueFrom(request);

      return result;
    } catch (e) {
      return this.defaultPrices[assetType].toString();
    }
  }

  async generateLiqpayPaymentLink(price: string, orderId: string) {
    const json = {
      public_key: this.liqpay.public,
      version: '3',
      action: 'payment_prepare',
      action_payment: 'pay',
      amount: price,
      currency: 'USD',
      description: 'test',
      order_id: orderId,
      server_url: 'https://ea51-45-128-191-180.ngrok.io/payment/liqpay',
    };
    const data = Buffer.from(JSON.stringify(json)).toString('base64');
    const sign_string = `${this.liqpay.private}${data}${this.liqpay.private}`;
    const signature = crypto.createHash('sha1').update(sign_string).digest('base64');
    try {
      const body = { data, signature };
      const request = this.httpService
        .post(`${this.liqpay.endpoint}/api/request`, body, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
        .pipe(map((res: any) => res.data));
      const result = await lastValueFrom(request);
      return result.result === 'ok' ? result.url_checkout : 'liqpay error';
    } catch (e) {
      console.log(e);
    }
  }

  async createPaymentOrder(assetType: AssetType, owner: string, price: string, paymentSystem: string) {
    const data = {
      owner,
      assetType,
      status: PaymentStatuses.NEW,
      price,
      paymentSystem,
    };

    const order = await this.orderModel.create(data);

    return order.toJSON();
  }

  async liqpayWebhook(body) {
    const decoded: any = JSON.parse(atob(body.data));
    // console.log(decoded);
    // console.log(
    //   `Liqpay webhook. Action: ${decoded.action}, Status: ${decoded.status}, Order id: ${decoded.order_id}, Amount: ${decoded.amount}, Currency: ${decoded.currency}`,
    // );
  }

  async stripeWebhook(event) {
    const orderId = await this.getStripeOrderID(event);

    if (orderId) {
      const order = await this.orderModel.findById(orderId);

      if (event.type === 'checkout.session.completed') {
        this.stripe.paymentLinks.update(event.data?.object?.payment_link, { active: false });
        if (event.data?.object?.payment_status === 'paid') {
          await this.updateOrderStatus(PaymentStatuses.PROCESSING, order);
          await this.processOrder(order);
        } else {
          this.updateOrderStatus(PaymentStatuses.CANCELLED, order);
        }
      }
    }
  }

  async updateOrderStatus(status, order) {
    order.set({ status: status });

    await order.save();
  }

  async processOrder(orderID) {
    const order = await this.orderModel.findById(orderID);

    // await this.createPaymentKey(order.assetType);

    const { txHash } = await this.claimAsset(order.assetType, order.owner);

    order.set({ txHash, status: PaymentStatuses.COMPLETED });
    await order.save();
  }

  async getStripeOrderID(event: any) {
    if (event.data?.object?.metadata?.orderId) {
      return event.data.object.metadata.orderId;
    } else {
      return null;
    }
  }

  async getStripePriceID(assetType: AssetType, totemPrice: string) {
    const products = await this.stripe.products.list();
    // const prices = await this.stripe.prices.list();
    let product = products.data.find((item) => item.name.toLowerCase() === assetType);
    let price;
    if (!product) {
      product = await this.stripe.products.create({
        name: assetType,
        default_price_data: { unit_amount: parseInt(totemPrice) * 100, currency: 'usd' },
        expand: ['default_price'],
      });
    }
    if (!product.default_price.amount) {
      price = await this.stripe.prices.retrieve(product.default_price);
    } else {
      price = product.default_price;
    }

    if (parseInt(totemPrice) * 100 !== price.unit_amount) {
      console.log('need to update price');
      const newPrice = await this.stripe.prices.create({
        product: product.id,
        unit_amount: parseInt(totemPrice) * 100,
        currency: 'usd',
      });
      await this.stripe.products.update(product.id, {
        default_price: newPrice.id,
      });
      await this.stripe.prices.update(price.id, { active: false });
      price = newPrice;
    }

    return price.id;
  }

  async generateStripePaymentLink(priceId: string, orderId: string, assetType: AssetType, payload) {
    const url = payload.successUrl
      ? new URL(payload.successUrl)
      : new URL(`${this.config.get<string>('payment.stripe.successURL')}`);

    const search_params = url.searchParams;
    search_params.set('type', assetType);
    url.search = search_params.toString();

    const body = {
      metadata: {
        orderId,
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: url.toString(),
        },
      },
    };

    const paymentLink = await this.stripe.paymentLinks.create(body);

    return paymentLink.url;
  }

  async createPaymentKey(assetType) {
    try {
      const url = `${this.config.get<string>(
        'provider.gameDirectory.endpoint',
      )}/payment-keys/${assetType}?apiKey=${this.config.get<string>('provider.gameDirectory.apiKey')}`;
      await lastValueFrom(
        this.httpService
          .post(url, {
            amount: 10,
          })
          .pipe(map((res: any) => res.data))
          .pipe(
            catchError((e) => {
              throw new InternalServerErrorException(e.response.data.message);
            }),
          ),
      );
    } catch (e) {
      throw new BadRequestException(`Core API response: ${e.response.message}`);
    }
  }

  async claimAsset(assetType, user: string) {
    try {
      const url = `${this.config.get<string>(
        'provider.gameDirectory.endpoint',
      )}/payment-keys/${assetType}/claim?apiKey=${this.config.get<string>('provider.gameDirectory.apiKey')}`;

      return await lastValueFrom(
        this.httpService
          .post(url, {
            playerAddress: user,
          })
          .pipe(map((res: any) => res.data))
          .pipe(
            catchError((e) => {
              throw new InternalServerErrorException(e.response.data.message);
            }),
          ),
      );
    } catch (e) {
      throw new BadRequestException(`Core API response: ${e.response.message}`);
    }
  }

  async createWithpaperLink(assetType: string, user: string, price: string, order: any) {
    let length = 0;
    if (assetType === 'avatar') {
      length = 32;
    } else if (assetType === 'item') {
      length = 16;
    } else {
      length = 8;
    }
    const tokenURIBuffer = webcrypto.getRandomValues(new Uint32Array(length));
    const uri = Buffer.from(tokenURIBuffer.buffer).toString('hex');

    try {
      const body = {
        expiresInMinutes: 15,
        limitPerTransaction: 1,
        redirectAfterPayment: false,
        sendEmailOnCreation: false,
        requireVerifiedEmail: false,
        quantity: 1,
        metadata: {},
        mintMethod: {
          name: 'mint',
          args: {
            to: user,
            uri,
          },
          payment: {
            value: '0.001',
            currency: 'USDC',
          },
        },
        feeBearer: 'BUYER',
        hideNativeMint: true,
        hidePaperWallet: true,
        hideExternalWallet: true,
        hidePayWithCard: false,
        hidePayWithCrypto: false,
        hidePayWithIdeal: true,
        sendEmailOnTransferSucceeded: false,
        usePaperKey: false,
        contractId: this.config.get<string>('payment.withpaper.contractId'),
        title: `Totem Asset: ${assetType}`,
        walletAddress: this.config.get<string>('payment.withpaper.walletAddress'),
      };
      const result = await lastValueFrom(
        this.httpService
          .post('https://withpaper.com/api/2022-08-12/checkout-link-intent', body, {
            headers: {
              Authorization: `Bearer ${this.config.get<string>('payment.withpaper.authToken')}`,
            },
          })
          .pipe(map((res: any) => res.data))
          .pipe(
            catchError((e) => {
              throw new BadRequestException(e.response.data.error);
            }),
          ),
      );
      return result.checkoutLinkIntentUrl;
    } catch (e) {
      throw new BadRequestException(e.response.message);
    }
  }
}

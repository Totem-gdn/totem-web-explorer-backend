import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BigNumber, constants, Contract, Event, providers } from 'ethers';
import * as abi from './contract-abi.json';
import { AssetEvent, AssetPayload, AssetQueue } from '../config/queues/assets';
import { DefaultJobOptions } from '../config/queues/defaults';
import { AssetType } from '../assets/types/assets';

@Injectable()
export class ExplorerService {
  private readonly logger = new Logger(ExplorerService.name);
  private readonly provider: providers.JsonRpcProvider;
  private readonly contracts: Record<AssetType, Contract>;
  private readonly queues: Record<AssetType, Queue<AssetPayload>>;
  private readonly storageKeys: Record<AssetType, string> = {
    avatars: `provider::avatar::blockNumber`,
    items: `provider::item::blockNumber`,
    gems: `provider::gem::blockNumber`,
  };
  private readonly deployBlockNumber: Record<AssetType, string> = {
    avatars: '0x1a683fc',
    items: '0x1a6c2ae',
    gems: '0x1a6c357',
  };

  constructor(
    private readonly config: ConfigService,
    @InjectRedis() private readonly redis: Redis,
    @InjectQueue(AssetQueue.Avatars)
    private readonly avatarsQueue: Queue<AssetPayload>,
    @InjectQueue(AssetQueue.Items)
    private readonly itemsQueue: Queue<AssetPayload>,
    @InjectQueue(AssetQueue.Gems)
    private readonly gemsQueue: Queue<AssetPayload>,
  ) {
    this.queues = {
      avatars: this.avatarsQueue,
      items: this.itemsQueue,
      gems: this.gemsQueue,
    };
    this.provider = new providers.JsonRpcProvider(config.get<string>('provider.rpc'));
    this.contracts = {
      avatars: new Contract(this.config.get<string>('provider.assets.avatar'), abi, this.provider),
      items: new Contract(this.config.get<string>('provider.assets.item'), abi, this.provider),
      gems: new Contract(this.config.get<string>('provider.assets.gem'), abi, this.provider),
    };
    // FIXME: deployBlock can be found only manually from explorers
    // Example: https://mumbai.polygonscan.com/token/0xEE7ff88E92F2207dBC19d89C1C9eD3F385513b35
    // use Alchemy or Infura as better solution to receive previous contract events
    void this.initContract('avatars');
    void this.initContract('items');
    void this.initContract('gems');
  }

  private async initContract(asset: AssetType) {
    await this.fetchPreviousEvents(asset);
    this.contracts[asset].on(
      this.contracts[asset].filters.Transfer(),
      (from: string, to: string, tokenId: BigNumber, event: Event) => {
        void this.addEventToQueue(asset, from, to, tokenId, event).catch((err) => this.logger.error(err));
      },
    );
  }

  private async fetchPreviousEvents(asset: AssetType) {
    let block = await this.redis
      .get(this.storageKeys[asset])
      .then((blockNumber: string | null) => parseInt(blockNumber || this.deployBlockNumber[asset], 16));
    let currentBlock = await this.provider.getBlockNumber();
    const perPage = 2000; // Alchemy recommended https://docs.alchemy.com/reference/eth-getlogs-polygon
    while (currentBlock > block) {
      this.logger.log(`[${asset}] fetching blocks from ${block} to ${block + perPage}`);
      // request events in blocks range
      const events = await this.contracts[asset].queryFilter('Transfer', block, block + perPage);
      // process all events, update block number in redis on every processed event
      for (const event of events) {
        const [from, to, tokenId] = event.args;
        await this.addEventToQueue(asset, from, to, tokenId, event);
      }
      // update currentBlock because we don't listen to events while processing previous events
      block += perPage + 1;
      currentBlock = await this.provider.getBlockNumber();
      await this.redis.set(this.storageKeys[asset], `0x${(block < currentBlock ? block : currentBlock).toString(16)}`);
    }
    this.logger.log(`[${asset}] fetching of previous events completed`);
    this.logger.log(`[${asset}] current block ${currentBlock}`);
  }

  private async addEventToQueue(asset: AssetType, from: string, to: string, tokenId: BigNumber, event: Event) {
    this.logger.log(`[${asset}] Transfer(${from}, ${to}, ${tokenId.toString()})`);
    await this.queues[asset].add(
      from === constants.AddressZero ? AssetEvent.Create : AssetEvent.Transfer,
      {
        assetType: asset,
        from,
        to,
        tokenId: (tokenId as BigNumber).toString(),
        transactionHash: event.transactionHash,
      },
      {
        jobId: event.transactionHash,
        ...DefaultJobOptions,
      },
    );
    await this.redis.set(this.storageKeys[asset], `0x${event.blockNumber.toString(16)}`);
  }
}

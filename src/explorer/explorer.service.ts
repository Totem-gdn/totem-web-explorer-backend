import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BigNumber, constants, Contract, Event, providers } from 'ethers';
import * as abi from './contract-abi.json';
import * as assetsLegacyABI from './assets-legacy-abi.json';
import * as gameDirectoryABI from './totem-games-directory.json';
import {
  AssetEvent,
  AssetPayload,
  AssetQueue,
  GameDirectoryEvent,
  GameDirectoryPayload,
  LegacyPayload,
  LegacyQueue,
} from '../config/queues/assets';
import { DefaultJobOptions } from '../config/queues/defaults';
import { AssetType } from '../assets/types/assets';

@Injectable()
export class ExplorerService {
  private readonly logger = new Logger(ExplorerService.name);
  private readonly provider: providers.JsonRpcProvider;
  private readonly contracts: Record<AssetType, Contract>;
  private readonly legacyContracts: Record<AssetType, Contract>;
  private readonly queues: Record<AssetType, Queue<AssetPayload>>;
  private readonly legacyQueues: Record<AssetType, Queue<LegacyPayload>>;
  private readonly gameDirectoryContract: Contract;
  private readonly storageKeys: Record<AssetType, string> = {
    avatars: `provider::avatar::blockNumber`,
    items: `provider::item::blockNumber`,
    gems: `provider::gem::blockNumber`,
  };
  private readonly deployBlockNumber: Record<AssetType, string> = {
    avatars: '0x1E5A890',
    items: '0x1E5A890',
    gems: '0x1E5A890',
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
    @InjectQueue(LegacyQueue.Avatars)
    private readonly avatarsLegacyQueue: Queue<LegacyPayload>,
    @InjectQueue(LegacyQueue.Items)
    private readonly itemsLegacyQueue: Queue<LegacyPayload>,
    @InjectQueue(LegacyQueue.Gems)
    private readonly gemsLegacyQueue: Queue<LegacyPayload>,
    @InjectQueue('game-directory-queue')
    private readonly gameDirectoryQueue: Queue<GameDirectoryPayload>,
  ) {
    this.queues = {
      avatars: this.avatarsQueue,
      items: this.itemsQueue,
      gems: this.gemsQueue,
    };
    this.legacyQueues = {
      avatars: this.avatarsLegacyQueue,
      items: this.itemsLegacyQueue,
      gems: this.gemsLegacyQueue,
    };
    this.provider = new providers.JsonRpcProvider(config.get<string>('provider.rpc'));
    this.contracts = {
      avatars: new Contract(this.config.get<string>('provider.assets.avatar'), abi, this.provider),
      items: new Contract(this.config.get<string>('provider.assets.item'), abi, this.provider),
      gems: new Contract(this.config.get<string>('provider.assets.gem'), abi, this.provider),
    };
    this.legacyContracts = {
      avatars: new Contract(this.config.get<string>('provider.legacy.avatar'), assetsLegacyABI, this.provider),
      items: new Contract(this.config.get<string>('provider.legacy.item'), assetsLegacyABI, this.provider),
      gems: new Contract(this.config.get<string>('provider.legacy.gem'), assetsLegacyABI, this.provider),
    };
    this.gameDirectoryContract = new Contract(
      this.config.get<string>('provider.gameDirectory.contract'),
      gameDirectoryABI,
      this.provider,
    );
    // FIXME: deployBlock can be found only manually from explorers
    // Example: https://mumbai.polygonscan.com/token/0xEE7ff88E92F2207dBC19d89C1C9eD3F385513b35
    // use Alchemy or Infura as better solution to receive previous contract events
    void this.initContract('avatars');
    void this.initContract('items');
    void this.initContract('gems');
    void this.initAssetsLegacyContract('avatars');
    void this.initAssetsLegacyContract('items');
    void this.initAssetsLegacyContract('gems');
    void this.initGameContract();
  }

  private async initGameContract() {
    this.gameDirectoryContract.on(
      this.gameDirectoryContract.filters.CreateGame(),
      async (gameAddress: string, owner: string, event: Event) => {
        const data = await this.gameDirectoryContract.gameByAddress(gameAddress);
        // const game = data['game'];
        const game = data;

        const updateData = {
          gameAddress: gameAddress,
          owner: owner,
          general: {
            name: game['name'],
            author: game['author'],
          },
          connections: {
            assetRenderer: game['renderer'],
            webpage: game['website'],
          },
        };

        await this.gameDirectoryQueue.add(GameDirectoryEvent.Create, updateData, { delay: 2000 });
      },
    );

    this.gameDirectoryContract.on(
      this.gameDirectoryContract.filters.UpdateGame(),
      async (gameAddress: string, owner: string, event: Event) => {
        // const recordId = parseInt(recordIdHEX._hex, 16).toString();
        // const txHash = event.transactionHash;

        const data = await this.gameDirectoryContract.gameByAddress(gameAddress);
        // const game = data['game'];
        const game = data;

        const updateData = {
          gameAddress: gameAddress,
          owner: owner,
          general: {
            name: game['name'],
            author: game['author'],
          },
          connections: {
            assetRenderer: game['renderer'],
            webpage: game['website'],
          },
        };

        await this.gameDirectoryQueue.add(GameDirectoryEvent.Update, updateData);
      },
    );
  }

  private async initAssetsLegacyContract(assetType: AssetType) {
    this.legacyContracts[assetType].on(
      this.legacyContracts[assetType].filters.AssetLegacyRecord(),
      (player: string, assetId: BigNumber, gameId: BigNumber, recordId: BigNumber) => {
        void this.addLegacyToQueue(assetType, assetId);
      },
    );
  }

  async getAssetDNA(assetType: AssetType, tokenId: string): Promise<string> {
    return await this.contracts[assetType].tokenURI(BigNumber.from(tokenId));
  }

  private async initContract(assetType: AssetType) {
    await this.fetchPreviousEvents(assetType);
    this.contracts[assetType].on(
      this.contracts[assetType].filters.Transfer(),
      (from: string, to: string, tokenId: BigNumber, event: Event) => {
        void this.addEventToQueue(assetType, from, to, tokenId, event).catch((err) => this.logger.error(err));
      },
    );
  }

  private async fetchPreviousEvents(assetType: AssetType) {
    let block = await this.redis
      .get(this.storageKeys[assetType])
      .then((blockNumber: string | null) => parseInt(blockNumber || this.deployBlockNumber[assetType], 16));
    let currentBlock = await this.provider.getBlockNumber();
    const perPage = 2000; // Alchemy recommended https://docs.alchemy.com/reference/eth-getlogs-polygon
    while (currentBlock > block) {
      this.logger.log(`[${assetType}] fetching blocks from ${block} to ${block + perPage}`);
      // request events in blocks range
      const events = await this.contracts[assetType].queryFilter('Transfer', block, block + perPage);
      // process all events, update block number in redis on every processed event
      for (const event of events) {
        const [from, to, tokenId] = event.args;
        await this.addEventToQueue(assetType, from, to, tokenId, event);
      }
      // update currentBlock because we don't listen to events while processing previous events
      block += perPage + 1;
      currentBlock = await this.provider.getBlockNumber();
      await this.redis.set(
        this.storageKeys[assetType],
        `0x${(block < currentBlock ? block : currentBlock).toString(16)}`,
      );
    }
    this.logger.log(`[${assetType}] fetching of previous events completed`);
    this.logger.log(`[${assetType}] current block ${currentBlock}`);
  }

  private async addLegacyToQueue(assetType: AssetType, tokenId: BigNumber) {
    const balanceResult = await this.legacyContracts[assetType].balanceOf(tokenId);
    const balance = parseInt(balanceResult._hex, 16);

    await this.legacyQueues[assetType].add('asset-legacy-update', {
      assetType,
      tokenId: (tokenId as BigNumber).toString(),
      legacyEventsAmount: balance,
    });
  }

  private async addEventToQueue(assetType: AssetType, from: string, to: string, tokenId: BigNumber, event: Event) {
    this.logger.log(`[${assetType}] Transfer(${from}, ${to}, ${tokenId.toString()})`);
    await this.queues[assetType].add(
      from === constants.AddressZero ? AssetEvent.Create : AssetEvent.Transfer,
      {
        assetType: assetType,
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
    await this.redis.set(this.storageKeys[assetType], `0x${event.blockNumber.toString(16)}`);
  }
}

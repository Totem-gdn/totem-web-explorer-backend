import { Body, Controller, Get, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameRequestDto } from './dto/game.dto';
import { ICreateGameResponse, IGameRecord } from './interfaces/games.interfaces';

@Controller('games')
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
  ) {
  }

  @Get()
  async find(): Promise<IGameRecord[]> {
    return await this.gamesService.find();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<IGameRecord> {
    return await this.gamesService.findOne(id);
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createGameDto: CreateGameRequestDto): Promise<ICreateGameResponse> {
    return await this.gamesService.create(createGameDto);
  }
}

import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>
  ) { }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase().trim();

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleExceptions(error);
    }

  }

  findAll() {
    return this.pokemonModel.find();
  }

  async findOne(term: string) {
    let pokemon: Pokemon;

    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({
        no: term
      });
    }

    // MongoID
    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    }

    // Name
    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({ name: term.toLocaleLowerCase() });
    }

    if (!pokemon) throw new NotFoundException(`Pokemon with id, name or no ${term} not found`);

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    try {
      const pokemon = await this.findOne(term);
      if (updatePokemonDto.name) updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();

      await pokemon.updateOne(updatePokemonDto);

      return { ...pokemon.toJSON(), ...updatePokemonDto };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    //const pokemon = await this.findOne(id);

    try {
      //await pokemon.deleteOne();
      const { deletedCount } = await this.pokemonModel.deleteOne({_id: id});
      if(deletedCount === 0) {
        throw new NotFoundException(`Pokemon with id ${id} not found`)
      }

      return;
    } catch (error) {
      this.handleExceptions(error);
    }
  }


  private handleExceptions(error: any) {
    console.log('====> ', error);

    if (error.code === 11000) {
      throw new BadRequestException(error.errmsg)
    }

    if (error.status === 400) {
      throw new BadRequestException(error.response.message)
    }

    if (error.status === 404) {
      throw new NotFoundException(error.response.message)
    }

    if (error.status === 500) {
      throw new InternalServerErrorException(error.response.message)
    }

    throw new InternalServerErrorException(`Can´t create Pokemon - Check server logs`);
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './entities/skill.entity';
import { User } from '../users/entities/user.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    private readonly usersService: UsersService // Inject UsersService
  ) {}

  /*  Get all skill titles */
  async getAllSkills(): Promise<{ title: string }[]> {
    return this.skillsRepository
      .createQueryBuilder('skill')
      .select('skill.title')
      .getRawMany();
  }

  /* Create a new skill for a user */
  async create(userId: string, createSkillDto: CreateSkillDto): Promise<Skill> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'freelancer') {
      throw new BadRequestException('Only freelancers can add skills');
    }

    const skill = this.skillsRepository.create({
      ...createSkillDto,
      user: user,
    });
    const savedSkill = await this.skillsRepository.save(skill);
    console.log(`Created skill with ID ${savedSkill.id} for user ${userId}`);
    return savedSkill;
  }

  async findAll(userId: string): Promise<Skill[]> {
    return this.skillsRepository.find({ where: { user: { id: userId } } });
  }

  async findOne(userId: string, id: string): Promise<Skill> {
    const skill = await this.skillsRepository.findOne({
      where: { id, user: { id: userId } },
    });
    if (!skill) {
      throw new NotFoundException(
        `Skill with ID ${id} not found for user ${userId}`
      );
    }
    return skill;
  }

  async update(
    userId: string,
    id: string,
    updateSkillDto: UpdateSkillDto
  ): Promise<Skill> {
    const skill = await this.findOne(userId, id);
    Object.assign(skill, updateSkillDto);
    return this.skillsRepository.save(skill);
  }

  async remove(userId: string, id: string): Promise<void> {
    const skill = await this.findOne(userId, id);
    await this.skillsRepository.remove(skill);
  }

  /* Search users by skill */
  async searchUsersBySkill(query: string): Promise<User[]> {
    const skills = await this.skillsRepository
      .createQueryBuilder('skill') // This line creates a query builder for the skill entity
      .leftJoinAndSelect('skill.user', 'user') // This line joins the user of each skill
      .leftJoinAndSelect('user.skills', 'userSkills') // This line joins the skills of each user
      .where('skill.title ILIKE :query', { query: `%${query}%` }) // This line filters skills by title
      .orWhere('skill.description ILIKE :query', { query: `%${query}%` }) // This line filters skills by description
      .select([
        'skill.id',
        'skill.title',
        'skill.description',
        'user.id',
        'user.username',
        'user.skillImageUrls',
        'user.email',
        'userSkills.id',
        'userSkills.title',
        'userSkills.description',
      ]) // This line selects the columns to return
      .getMany(); // This line executes the query and returns the results

    console.log('Generated Query:', skills);

    const uniqueUsers = new Map<string, User>();
    skills.forEach((skill) => {
      if (skill.user) {
        uniqueUsers.set(skill.user.id, skill.user);
      }
    });

    return Array.from(uniqueUsers.values());
  }
}

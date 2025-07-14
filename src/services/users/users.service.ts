// This file is deprecated and will be replaced by the new student service
// Keeping for backward compatibility during migration

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { UpdateUserDto } from 'src/dto/update-user.dto';

@Injectable()
export class UsersService {
  private users = [
    {
      id: 1,
      name: 'Rishabh Prajapati',
      age: 26,
      email: 'rishi@test.com',
      role: 'ADMIN',
    },
    {
      id: 2,
      name: 'Rahul Prajapati',
      age: 21,
      email: 'rahul@test.com',
      role: 'INTERN',
    },
    {
      id: 3,
      name: 'Rimit Prajapati',
      age: 25,
      email: 'rimit@test.com',
      role: 'ENGINEER',
    },
    {
      id: 4,
      name: 'Rahesh Prajapati',
      age: 21,
      email: 'rahesh@test.com',
      role: 'INTERN',
    },
    {
      id: 5,
      name: 'Rinku Prajapati',
      age: 20,
      email: 'rinku@test.com',
      role: 'INTERN',
    },
    {
      id: 6,
      name: 'Rakesh Prajapati',
      age: 30,
      email: 'rakesh@test.com',
      role: 'ENGINEER',
    },
    {
      id: 7,
      name: 'Rohit Prajapati',
      age: 25,
      email: 'rohi@test.com',
      role: 'ENGINEER',
    },
  ];

  findAll(role?: 'INTERN' | 'ENGINEER' | 'ADMIN') {
    if (role) {
      const roleArray = this.users.filter((user) => user.role === role);
      if (roleArray.length === 0) {
        throw new NotFoundException('User Role Not found');
      }
      return roleArray;
    }

    return this.users;
  }

  findOne(id: number) {
    const user = this.users.find((user) => user.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  create(createUserDto: CreateUserDto) {
    const usersByHighestId = [...this.users].sort((a, b) => b.id - a.id);
    const newUser = {
      id: usersByHighestId[0].id + 1,
      ...createUserDto,
    };
    this.users.push(newUser);
    return newUser;
  }
  update(id: number, updateUserDto: UpdateUserDto) {
    this.users = this.users.map((user) => {
      if (Number(user.id) === id) {
        return { ...user, ...updateUserDto };
      } else {
        return user;
      }
    });
    return this.findOne(id);
  }

  delete(id: number) {
    const removedUser = this.findOne(id);
    this.users = this.users.filter((user) => user.id !== id);

    return removedUser;
  }
}

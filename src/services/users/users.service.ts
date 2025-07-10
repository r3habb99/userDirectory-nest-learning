import { Injectable } from '@nestjs/common';

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
      return this.users.filter((user) => user.role === role);
    }
    return this.users;
  }

  findOne(id: number) {
    const user = this.users.find((user) => user.id === id);
    return user;
  }

  create(user: {
    name: string;
    email: string;
    age: number;
    role: 'INTERN' | 'ENGINEER' | 'ADMIN';
  }) {
    const usersByHighestId = [...this.users].sort((a, b) => b.id - a.id);
    const newUser = {
      id: usersByHighestId[0].id + 1,
      ...user,
    };
    this.users.push(newUser);
    return newUser;
  }
  update(
    id: number,
    updatedUser: {
      name?: string;
      email?: string;
      age?: number;
      role?: 'INTERN' | 'ENGINEER' | 'ADMIN';
    },
  ) {
    this.users = this.users.map((user) => {
      if (Number(user.id) === id) {
        return { ...user, ...updatedUser };
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

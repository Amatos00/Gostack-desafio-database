import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: string;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    category: categoryTitle,
    type,
    value,
  }: Request): Promise<Transaction> {
    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Invalid transaction type');
    }

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Insufficient balance for transaction');
    }

    const categoriesRepository = getRepository(Category);

    const categoryAlreadyExists = await categoriesRepository.findOne({
      where: { title: categoryTitle },
    });

    let transaction: Transaction;

    if (categoryAlreadyExists) {
      transaction = transactionsRepository.create({
        title,
        type,
        value,
        category_id: categoryAlreadyExists.id,
      });
    } else {
      const category = categoriesRepository.create({
        title: categoryTitle,
      });

      await categoriesRepository.save(category);

      transaction = transactionsRepository.create({
        title,
        type,
        value,
        category,
      });
    }

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;

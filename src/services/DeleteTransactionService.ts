import { getCustomRepository } from 'typeorm';

import TransactionRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionRepository);

    const transaction = await transactionRepository.findOne(id);

    if (!transaction) {
      throw new AppError('Invalid transaction id');
    }

    const balance = await transactionRepository.getBalance();

    if (
      transaction.type === 'income' &&
      balance.total - transaction.value < 0
    ) {
      throw new AppError("That transaction can't be removed");
    }

    await transactionRepository.delete(transaction.id);
  }
}

export default DeleteTransactionService;

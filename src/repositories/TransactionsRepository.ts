import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const incomeValues = transactions.map(transaction => {
      if (transaction.type === 'income') {
        return Number(transaction.value);
      }

      return 0;
    });

    const outcomeValues = transactions.map(transaction => {
      if (transaction.type === 'outcome') {
        return Number(transaction.value);
      }

      return 0;
    });

    const income = incomeValues.reduce((accumulator, currentValue) => {
      return accumulator + currentValue;
    }, 0);

    const outcome = outcomeValues.reduce((accumulator, currentValue) => {
      return accumulator + currentValue;
    }, 0);

    return {
      income,
      outcome,
      total: income - outcome,
    };
  }
}

export default TransactionsRepository;

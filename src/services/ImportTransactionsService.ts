import csvParse from 'csv-parse';
import fs from 'fs';
import { getRepository, In } from 'typeorm';
import Category from '../models/Category';

import Transaction from '../models/Transaction';

interface Request {
  filePath: string;
}

interface TransactionsOnCVG {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ filePath }: Request): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getRepository(Transaction);

    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
      trim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactionsOnCVG: TransactionsOnCVG[] = [];
    const categoriesOnCVG: string[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, category] = line;

      if (!title || !type || !value || !category) return;

      categoriesOnCVG.push(category);
      transactionsOnCVG.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categoriesOnCVG),
      },
    });

    const existentCategoriesTitle = existentCategories.map(
      category => category.title,
    );

    const categoriesToAdd = categoriesOnCVG
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index)
      .map(categoryTitle => ({ title: categoryTitle }));

    const newCategories = categoriesRepository.create(categoriesToAdd);

    await categoriesRepository.save(newCategories);

    const finalCategories = [...existentCategories, ...newCategories];

    const transactions = transactionsRepository.create(
      transactionsOnCVG.map(transaction => {
        return {
          title: transaction.title,
          type: transaction.type,
          value: transaction.value,
          category: finalCategories.find(
            category => category.title === transaction.category,
          ),
        };
      }),
    );

    await transactionsRepository.save(transactions);
    await fs.promises.unlink(filePath);

    return transactions;
  }
}

export default ImportTransactionsService;

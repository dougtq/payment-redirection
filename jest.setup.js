jest.mock('knex', () => {
  const fn = () => {
    return {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      raw: jest.fn().mockResolvedValue([[]]),
    };
  };
  fn.raw = jest.fn().mockResolvedValue([[]]);
  return fn;
});

jest.mock('starkbank', () => ({
  Project: jest.fn().mockImplementation(() => ({
    // Mock any methods you use on the project instance
  })),
  boleto: { // Lowercase 'b' to match the code
    create: jest.fn().mockResolvedValue([{
      id: 'mock-transaction-id'
    }])
  }
}));

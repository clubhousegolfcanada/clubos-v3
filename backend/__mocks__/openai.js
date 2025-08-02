// Manual mock for OpenAI
const mockCreate = jest.fn();

const OpenAI = jest.fn().mockImplementation(() => ({
  chat: {
    completions: {
      create: mockCreate
    }
  }
}));

OpenAI.mockCreate = mockCreate;

module.exports = OpenAI;
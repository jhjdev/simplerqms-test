import { Mock } from 'jest-mock';

declare global {
  var mockSql: Mock & {
    mockResolvedValueOnce: (value: any[]) => Mock;
    mockClear: () => void;
  };
}

// Minimal dummy — satisfies imports for commerce/cart. No business logic.
export const ActionCode = {
  NO_ACTION: 0,
  INSERT_SUCCESS: 1,
  UPDATE_SUCCESS: 2,
  DELETE_SUCCESS: 3,
  INSERT_FAILURE: -1,
  NOT_UNIQUE: -2,
  INCORRECT_INFORMATION: -3,
  UNAUTHORIZED_ACCESS: -4,
  UPDATE_FAILURE: -5,
  PARTIAL_UPDATE_FAILURE: -6,
  DELETE_FAILURE: -7,
} as const;

export type ActionCodeValue = (typeof ActionCode)[keyof typeof ActionCode];

const { authenticateToken } = require('./auth');
const jwt = require('jsonwebtoken');

describe('authenticateToken Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {
        authorization: 'Bearer validToken'
      }
    };
    res = {
      sendStatus: jest.fn()
    };
    next = jest.fn();
  });

it('should return 401 when the authorization header is missing', () => {
  req.headers.authorization = undefined;
  authenticateToken(req, res, next);
  expect(res.sendStatus).toHaveBeenCalledWith(401);
  expect(next).not.toHaveBeenCalled();
});
});

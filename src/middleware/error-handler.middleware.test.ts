import { Request, Response, NextFunction } from "express";
import { errorHandlerMiddleware } from "./error-handler.middleware";

describe("Error Handler Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it("should handle errors and return 500 status", () => {
    const error = new Error("Test error");
    
    errorHandlerMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("should handle unknown error types", () => {
    const unknownError = "String error";
    
    errorHandlerMiddleware(unknownError, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("should handle null errors", () => {
    errorHandlerMiddleware(null as any, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("should log errors to console", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const error = new Error("Test error");
    
    errorHandlerMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(consoleSpy).toHaveBeenCalledWith(error);
    consoleSpy.mockRestore();
  });
});
from fastapi import HTTPException, status


class PDFProcessingError(HTTPException):
    def __init__(self, detail: str = "Failed to process PDF file"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


class ModelNotLoadedError(HTTPException):
    def __init__(self, model_name: str):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ML model '{model_name}' is not loaded or unavailable",
        )


class ContractNotFoundError(HTTPException):
    def __init__(self, contract_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contract with id '{contract_id}' not found",
        )

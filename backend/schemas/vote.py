from pydantic import BaseModel, field_validator


class VoteCreate(BaseModel):
    value: int

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: int) -> int:
        if v not in (1, -1):
            raise ValueError("El voto debe ser 1 o -1")
        return v


class VoteResult(BaseModel):
    score: int
    user_vote: int | None

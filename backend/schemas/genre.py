from pydantic import BaseModel


class GenreOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}

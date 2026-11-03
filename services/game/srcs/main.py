from fastapi import FastAPI
import os

from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship
from sqlalchemy import create_engine, dialects

app = FastAPI()

engine = create_engine(os.environ["DATABASE_URL"], echo=True)

print("engine: ", engine);
# class Base(DeclarativBase):
#     pass
#
# class Games(Base):
#     __tablename__ = "games"
#
#     id: Mapped[int] = mapped_column(primary_key=True)
#     # n_rounds			SMALLINT NOT NULL,
#     # current_round	SMALLINT NOT NULL,
#     # seed_capital	BIGINT NOT NULL,
#     # creator_id		BIGINT NOT NULL, -- points to a user in the users db
#     # created_at		TIMESTAMPTZ NOT NULL DEFAULT now()
#
#     def __repr__(self) -> str:
#         return f"Game(id={self.id})"


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}

@app.post("/create_game")
def create_game():
    pass
    #

from fastapi import FastAPI
import os

from datetime import datetime
from sqlalchemy import ForeignKey
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship
from sqlalchemy import create_engine, dialects
from sqlalchemy.orm import Session

app = FastAPI()

print(f"DATABASE_URL: {os.environ["DATABASE_URL"]}");
engine = create_engine(os.environ["DATABASE_URL"], echo=True)
#
print("engine: ", engine);

class Base(DeclarativeBase):
    pass

class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(primary_key=True)
    id_code: Mapped[str] = mapped_column(String)
    n_rounds: Mapped[int] = mapped_column(Integer)
    current_round: Mapped[int] = mapped_column(Integer)
    seed_capital: Mapped[int] = mapped_column(Integer)
    creator_id: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[DateTime] = mapped_column(DateTime, default=datetime.utcnow)
    # n_rounds			SMALLINT NOT NULL,
    # current_round	SMALLINT NOT NULL,
    # seed_capital	BIGINT NOT NULL,
    # creator_id		BIGINT NOT NULL, -- points to a user in the users db
    # created_at		TIMESTAMPTZ NOT NULL DEFAULT now()

    def __repr__(self) -> str:
        return f"Game(id={self.id})"

# with Session(engine) as session:
#     new_game = Game(id_code="abc123", n_rounds=12, current_round=0, seed_capital=100000, creator_id=1)
#     session.add(new_game)
#     session.commit()

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}

@app.post("/create_game")
def create_game():
    pass

@app.get("/game/{id_code}")
def get_game(id_code: str):
    with Session(engine) as session:
        return {"game": session.query(Game).filter(Game.id_code == id_code).first()}


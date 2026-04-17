from __future__ import annotations

from dataclasses import dataclass
from math import ceil
from typing import Generic, TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

ModelT = TypeVar("ModelT")


@dataclass
class Page:
    items: list[object]
    page: int
    size: int
    total: int

    @property
    def pages(self) -> int:
        return ceil(self.total / self.size) if self.size else 0


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, identifier: str) -> ModelT | None:
        return self.session.get(self.model, identifier)

    def add(self, instance: ModelT) -> ModelT:
        self.session.add(instance)
        self.session.flush()
        return instance

    def paginate(self, stmt: Select[tuple[ModelT]], page: int, size: int) -> Page:
        total = self.session.scalar(select(func.count()).select_from(stmt.order_by(None).subquery()))
        items = list(
            self.session.scalars(
                stmt.offset((page - 1) * size).limit(size)
            ).unique()
        )
        return Page(items=items, page=page, size=size, total=total or 0)


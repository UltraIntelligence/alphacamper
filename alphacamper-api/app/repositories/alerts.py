from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.entities import AlertSubscription, NotificationDelivery
from app.repositories.base import BaseRepository, Page


class AlertSubscriptionRepository(BaseRepository[AlertSubscription]):
    model = AlertSubscription

    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def get_subscription(self, subscription_id: str) -> AlertSubscription | None:
        return self.session.scalar(
            select(AlertSubscription).where(AlertSubscription.id == subscription_id)
        )

    def delete_subscription(self, subscription_id: str) -> bool:
        result = self.session.execute(
            delete(AlertSubscription).where(AlertSubscription.id == subscription_id)
        )
        return (result.rowcount or 0) > 0


class NotificationDeliveryRepository(BaseRepository[NotificationDelivery]):
    model = NotificationDelivery

    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def list_for_subscription(
        self,
        subscription_id: str,
        *,
        page: int,
        size: int,
    ) -> Page:
        stmt = (
            select(NotificationDelivery)
            .where(NotificationDelivery.alert_subscription_id == subscription_id)
            .order_by(NotificationDelivery.attempted_at.desc())
        )
        return self.paginate(stmt, page=page, size=size)

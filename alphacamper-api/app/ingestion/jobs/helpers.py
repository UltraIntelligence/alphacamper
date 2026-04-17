from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import Campground, Campsite, Notice, Park, Provider
from app.models.enums import ProviderKind


def get_or_create_provider(
    session: Session,
    *,
    name: str,
    kind: ProviderKind,
    base_url: str,
    country: str | None,
    notes: str | None = None,
) -> Provider:
    provider = session.scalar(select(Provider).where(Provider.name == name))
    if provider:
        provider.kind = kind
        provider.base_url = base_url
        provider.country = country
        provider.notes = notes
        session.flush()
        return provider

    provider = Provider(
        name=name,
        kind=kind,
        base_url=base_url,
        country=country,
        notes=notes,
    )
    session.add(provider)
    session.flush()
    return provider


def upsert_park(
    session: Session,
    *,
    provider_id: str,
    external_park_id: str | None,
    defaults: dict[str, Any],
) -> Park:
    park = session.scalar(
        select(Park).where(
            Park.provider_id == provider_id,
            Park.external_park_id == external_park_id,
        )
    )
    if not park:
        park = Park(provider_id=provider_id, external_park_id=external_park_id, **defaults)
        session.add(park)
    else:
        for key, value in defaults.items():
            setattr(park, key, value)
    session.flush()
    return park


def upsert_campground(
    session: Session,
    *,
    provider_id: str,
    external_facility_id: str | None,
    defaults: dict[str, Any],
) -> Campground:
    campground = session.scalar(
        select(Campground).where(
            Campground.provider_id == provider_id,
            Campground.external_facility_id == external_facility_id,
        )
    )
    if not campground:
        campground = Campground(
            provider_id=provider_id,
            external_facility_id=external_facility_id,
            **defaults,
        )
        session.add(campground)
    else:
        for key, value in defaults.items():
            setattr(campground, key, value)
    session.flush()
    return campground


def upsert_campsite(
    session: Session,
    *,
    provider_id: str,
    campground_id: str,
    external_campsite_id: str | None,
    defaults: dict[str, Any],
) -> Campsite:
    campsite = session.scalar(
        select(Campsite).where(
            Campsite.provider_id == provider_id,
            Campsite.external_campsite_id == external_campsite_id,
        )
    )
    if not campsite:
        campsite = Campsite(
            provider_id=provider_id,
            campground_id=campground_id,
            external_campsite_id=external_campsite_id,
            **defaults,
        )
        session.add(campsite)
    else:
        campsite.campground_id = campground_id
        for key, value in defaults.items():
            setattr(campsite, key, value)
    session.flush()
    return campsite


def upsert_notice(
    session: Session,
    *,
    provider_id: str,
    external_notice_id: str | None,
    defaults: dict[str, Any],
) -> Notice:
    notice = session.scalar(
        select(Notice).where(
            Notice.provider_id == provider_id,
            Notice.external_notice_id == external_notice_id,
        )
    )
    if not notice:
        notice = Notice(
            provider_id=provider_id,
            external_notice_id=external_notice_id,
            **defaults,
        )
        session.add(notice)
    else:
        for key, value in defaults.items():
            setattr(notice, key, value)
    session.flush()
    return notice

import structlog
from fastapi import APIRouter, Depends

from polar.auth.dependencies import Auth
from polar.exceptions import Unauthorized
from polar.integrations.stripe.service import stripe as stripe_service
from polar.postgres import AsyncSession, get_db_session
from polar.tags.api import Tags
from polar.types import ListResource, Pagination

from .schemas import (
    PaymentMethod,
)

log = structlog.get_logger()

router = APIRouter(tags=["payment_methods"])


@router.get(
    "/payment_methods",
    response_model=ListResource[PaymentMethod],
    tags=[Tags.INTERNAL],
    status_code=200,
)
async def list(
    auth: Auth = Depends(Auth.current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ListResource[PaymentMethod]:
    if not auth.user:
        raise Unauthorized()

    pms = await stripe_service.list_user_payment_methods(session, auth.user)

    return ListResource(
        items=[PaymentMethod.from_stripe(pm) for pm in pms],
        pagination=Pagination(total_count=len(pms)),
    )


@router.post(
    "/payment_methods/{id}/detach",
    response_model=PaymentMethod,
    tags=[Tags.INTERNAL],
    status_code=200,
)
async def detach(
    id: str,
    auth: Auth = Depends(Auth.current_user),
) -> PaymentMethod:
    if not auth.user:
        raise Unauthorized()
    pm = stripe_service.detach_payment_method(id)
    return PaymentMethod.from_stripe(pm)

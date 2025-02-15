from collections.abc import Callable, Coroutine
from uuid import UUID
from datetime import datetime, UTC, timedelta
import os
from unittest.mock import MagicMock

import pytest
import pytest_asyncio
from pydantic import EmailStr
from pytest_mock import MockerFixture

from polar.models import MagicLink, User
from polar.kit.crypto import get_token_hash, generate_token
from polar.magic_link.service import magic_link as magic_link_service, InvalidMagicLink
from polar.magic_link.schemas import MagicLinkRequest
from polar.kit.db.postgres import AsyncSession
from polar.config import settings

GenerateMagicLinkToken = Callable[
    [str, UUID | None, datetime | None], Coroutine[None, None, tuple[MagicLink, str]]
]


@pytest_asyncio.fixture
async def generate_magic_link_token(
    session: AsyncSession,
) -> GenerateMagicLinkToken:
    async def _generate_magic_link_token(
        user_email: str, user_id: UUID | None, expires_at: datetime | None
    ) -> tuple[MagicLink, str]:
        token, token_hash = generate_token(secret=settings.SECRET)
        magic_link = MagicLink(
            token_hash=token_hash,
            user_email=user_email,
            user_id=user_id,
            expires_at=expires_at,
        )
        session.add(magic_link)
        await session.commit()

        return magic_link, token

    return _generate_magic_link_token


@pytest.mark.asyncio
async def test_request(session: AsyncSession, mocker: MockerFixture) -> None:
    magic_link_request = MagicLinkRequest(email=EmailStr("user@example.com"))

    magic_link, token = await magic_link_service.request(session, magic_link_request)

    assert magic_link.user_email == "user@example.com"
    assert magic_link.token_hash == get_token_hash(token, secret=settings.SECRET)


@pytest.mark.asyncio
async def test_authenticate_invalid_token(session: AsyncSession) -> None:
    with pytest.raises(InvalidMagicLink):
        await magic_link_service.authenticate(session, "INVALID_TOKEN")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "expires_at",
    [
        datetime(1900, 1, 1, tzinfo=UTC),
        datetime.now(UTC) - timedelta(seconds=1),
        datetime.now(UTC),
    ],
)
async def test_authenticate_expired_token(
    session: AsyncSession,
    expires_at: datetime,
    generate_magic_link_token: GenerateMagicLinkToken,
) -> None:
    _, token = await generate_magic_link_token("user@example.com", None, expires_at)
    with pytest.raises(InvalidMagicLink):
        await magic_link_service.authenticate(session, token)


@pytest.mark.asyncio
async def test_send(
    generate_magic_link_token: GenerateMagicLinkToken, mocker: MockerFixture
) -> None:
    email_sender_mock = MagicMock()
    mocker.patch(
        "polar.magic_link.service.get_email_sender", return_value=email_sender_mock
    )

    magic_link, _ = await generate_magic_link_token("user@example.com", None, None)

    await magic_link_service.send(magic_link, "TOKEN")

    send_to_user_mock: MagicMock = email_sender_mock.send_to_user
    assert send_to_user_mock.called
    to_email_addr = send_to_user_mock.call_args[0][0]
    subject = send_to_user_mock.call_args[0][1]
    body = send_to_user_mock.call_args[0][2]

    assert to_email_addr == "user@example.com"
    expected_content = f"{subject}\n<hr>\n{body}"

    # Run with `POLAR_TEST_RECORD=1 pytest` to produce new golden files :-)
    record = os.environ.get("POLAR_TEST_RECORD", False) == "1"
    record_file_name = "./tests/magic_link/testdata/magic_link.html"

    if record:
        with open(record_file_name, "w+") as f:
            f.write(expected_content)

    with open(record_file_name, "r") as f:
        content = f.read()
        assert content == expected_content


@pytest.mark.asyncio
async def test_authenticate_existing_user(
    session: AsyncSession, generate_magic_link_token: GenerateMagicLinkToken
) -> None:
    user = User(username="user@example.com", email="user@example.com")
    session.add(user)
    await session.commit()

    magic_link, token = await generate_magic_link_token(user.email, user.id, None)

    authenticated_user = await magic_link_service.authenticate(session, token)
    assert authenticated_user.id == user.id

    deleted_magic_link = await magic_link_service.get(session, magic_link.id)
    assert deleted_magic_link is None


@pytest.mark.asyncio
async def test_authenticate_existing_user_unlinked_from_magic_token(
    session: AsyncSession, generate_magic_link_token: GenerateMagicLinkToken
) -> None:
    user = User(username="user@example.com", email="user@example.com")
    session.add(user)
    await session.commit()

    magic_link, token = await generate_magic_link_token("user@example.com", None, None)

    authenticated_user = await magic_link_service.authenticate(session, token)
    assert authenticated_user.id == user.id

    deleted_magic_link = await magic_link_service.get(session, magic_link.id)
    assert deleted_magic_link is None


@pytest.mark.asyncio
async def test_authenticate_new_user(
    session: AsyncSession, generate_magic_link_token: GenerateMagicLinkToken
) -> None:
    magic_link, token = await generate_magic_link_token("user@example.com", None, None)

    authenticated_user = await magic_link_service.authenticate(session, token)
    assert authenticated_user.email == magic_link.user_email

    deleted_magic_link = await magic_link_service.get(session, magic_link.id)
    assert deleted_magic_link is None

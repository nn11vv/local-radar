from db.session import get_session


def get_db():
    with get_session() as session:
        yield session

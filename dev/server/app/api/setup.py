from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import tuple_
from sqlalchemy.orm import Session
from app.dependencies.auth import get_current_user
from app.db.session import get_db
from app.db.models.model_config import ModelConfig
from app.db.models.model_provider import ModelProvider
from app.db.models.model import Model
from app.db.models.user import User
from app.db.models.assets import Asset
from app.db.models.watchlist import Watchlist
from app.types.SaveApiKeyRequest import SaveApiKeyRequest
from typing import List

from app.services.stockSymbolSearch import stockSymbolSearch
router = APIRouter()

@router.get("/providers", status_code=status.HTTP_200_OK)
def get_providers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    available_providers = (
        db.query(
            ModelProvider.provider_id,
            ModelProvider.provider_name,
            ModelProvider.pricing_url,
        )
        .filter(ModelProvider.is_active == True)
        .distinct()
        .all()
    )

    

    return {
        "providers": [
            {
                "provider_id": provider.provider_id,
                "provider_name": provider.provider_name,
                "pricing_url": provider.pricing_url,
            }
            for provider in available_providers
        ]
    }

@router.get("/models", status_code=status.HTTP_200_OK)
def get_models(
    provider: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    available_models = (
        db.query(Model)
        .filter(
            Model.provider_id == provider,
            Model.is_active == True,
        )
        .all()
    )

    return {
        "models": [
            {
                "model_id": model.model_id,
                "model_name": model.model_name,
            }
            for model in available_models
        ],
        "detail" : "Successful model retrieval" if len(available_models) > 0  else "No models available at the moment for this provider"
    }

@router.post("/save_api_key", status_code=status.HTTP_200_OK)
def save_api_key(
    payload: SaveApiKeyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.api_key.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API key is required.",
        )

    db.query(ModelConfig).filter(
         ModelConfig.user_id == current_user.user_id
        ).update({ModelConfig.is_active: False}
    )

    selected_model = (
        db.query(Model)
        .filter(
            Model.model_id == payload.model_id,
            Model.provider_id == payload.provider_id,
            Model.is_active == True
        )
        .first()
    )

    if not selected_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Selected model is not available for this provider.",
        )

    api_key = payload.api_key.strip()
    api_key_last4 = api_key[-4:] if len(api_key) >= 4 else api_key

    existing_config = (
        db.query(ModelConfig)
        .filter(
            ModelConfig.user_id == current_user.user_id,
            ModelConfig.model_id == payload.model_id,
        )
        .first()
    )

    if existing_config:
        existing_config.encrypted_api_key = api_key
        existing_config.api_key_last4 = api_key_last4
        existing_config.is_active = True
    else:
        existing_config = ModelConfig(
            user_id=current_user.user_id,
            model_id=payload.model_id,
            encrypted_api_key=api_key,
            api_key_last4=api_key_last4,
            is_active=True,
        )
        db.add(existing_config)

    db.commit()

    return {
        "detail": "Model connection saved.",
    }

@router.post("/validate-assets", status_code=status.HTTP_200_OK)
async def validate_assets(
    assets: List[str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not assets or not any(asset.strip() for asset in assets):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter at least one symbol to validate",
        )

    requested_symbols = [asset.strip().upper() for asset in assets if asset.strip()]

    existing_assets = (
        db.query(Asset)
        .filter(Asset.symbol.in_(requested_symbols))
        .all()
    )

    existing_symbols = {asset.symbol for asset in existing_assets}
    pending_assets = [asset for asset in requested_symbols if asset not in existing_symbols]
    requested_asset_lists = [
        await stockSymbolSearch(symbol)
        for symbol in pending_assets
    ]
    requested_assets = [
        asset
        for asset_list in requested_asset_lists
        for asset in asset_list
    ]

    requested_asset_keys = {
        (asset["symbol"], asset["exchange"])
        for asset in requested_assets
    }

    existing_requested_asset_keys = set()
    if requested_asset_keys:
        existing_requested_assets = (
            db.query(Asset)
            .filter(tuple_(Asset.symbol, Asset.exchange).in_(requested_asset_keys))
            .all()
        )
        existing_requested_asset_keys = {
            (asset.symbol, asset.exchange)
            for asset in existing_requested_assets
        }

    for asset in requested_assets:
        asset_key = (asset["symbol"], asset["exchange"])

        if asset_key not in existing_requested_asset_keys:
            new_asset = Asset(
                symbol=asset["symbol"],
                company_name=asset["name"],
                exchange=asset["exchange"],
                currency=asset["currency"],
            )
            db.add(new_asset)
            existing_requested_asset_keys.add(asset_key)

    db.commit()

    db_assets = (
        db.query(Asset)
        .filter(Asset.symbol.in_(requested_symbols))
        .all()
    )

    db_matches_by_symbol = {
        symbol: [
            asset
            for asset in db_assets
            if asset.symbol == symbol
        ]
        for symbol in requested_symbols
    }

    return {
        "data": [
            {
                "symbol": symbol,
                "matches": [
                    {
                        "name": result.company_name,
                        "exchange": result.exchange,
                        "currency": result.currency,
                    }
                    for result in db_matches_by_symbol[symbol]
                ],
            }
            for symbol in requested_symbols
        ],
        "detail": "Asset validation completed.",
    }


@router.put("/save-watchlist", status_code=status.HTTP_200_OK)
async def save_watchlist(
    payload: List[dict],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload or not any(payload):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request is malformed"
        )

    requested_assets = [
        {
            "symbol": asset.get("symbol", "").strip().upper(),
            "name": asset.get("name", "").strip(),
            "exchange": asset.get("exchange", "").strip(),
            "currency": asset.get("currency", "").strip(),
        }
        for asset in payload
        if asset
    ]

    if not requested_assets or any(
        not asset["symbol"] or not asset["name"] or not asset["exchange"] or not asset["currency"]
        for asset in requested_assets
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Every watchlist asset must include symbol, name, exchange, and currency.",
        )

    requested_asset_keys = {
        (asset["symbol"], asset["exchange"])
        for asset in requested_assets
    }

    existing_assets = (
        db.query(Asset)
        .filter(tuple_(Asset.symbol, Asset.exchange).in_(requested_asset_keys))
        .all()
    )
    existing_asset_keys = {
        (asset.symbol, asset.exchange)
        for asset in existing_assets
    }

    missing_asset_keys = requested_asset_keys - existing_asset_keys

    if missing_asset_keys:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more selected assets were not validated. Please validate your watchlist again.",
        )

    db.query(Watchlist).filter(
        Watchlist.user_id == current_user.user_id
    ).delete()

    watchlist_items = [
        Watchlist(user_id=current_user.user_id, asset_id=asset.asset_id)
        for asset in existing_assets
    ]

    db.add_all(watchlist_items)
    db.commit()

    return {
        "detail" : "Watchlist saved."
    }
    

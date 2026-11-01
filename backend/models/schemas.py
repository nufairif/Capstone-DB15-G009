from typing import List, Optional
from pydantic import BaseModel, Field


class CustomerPayload(BaseModel):
    name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class OrderItemPayload(BaseModel):
    product_type: str = Field(..., min_length=2)
    quantity: int = Field(default=1, ge=1)
    color: Optional[str] = None
    size: Optional[str] = None
    custom_text: Optional[str] = None
    font_style: Optional[str] = None
    layout_notes: Optional[str] = None


class OrderCreatePayload(BaseModel):
    customer_id: Optional[int] = None
    customer_name: str = Field(..., min_length=2)
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    raw_message: Optional[str] = None
    category: str = "Custom Sajadah"
    ai_confidence: float = 0.95
    status: str = "New"
    greeting_card_requested: bool = False
    greeting_occasion: Optional[str] = None
    greeting_sender: Optional[str] = None
    greeting_recipient: Optional[str] = None
    greeting_draft: Optional[str] = None
    additional_notes: Optional[str] = None
    items: List[OrderItemPayload] = Field(default_factory=list)


class StatusUpdatePayload(BaseModel):
    status: str


class RAGQueryPayload(BaseModel):
    query: str = Field(..., min_length=3)
    top_k: int = Field(default=2, ge=1, le=5)


class LoginPayload(BaseModel):
    username: str = Field(..., min_length=2)
    password: str = Field(..., min_length=3)


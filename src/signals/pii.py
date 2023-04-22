"""Compute text statistics for a document."""
import re
from typing import Iterable, Optional

from typing_extensions import override

from ..embeddings.vector_store import VectorStore
from ..schema import DataType, EnrichmentType, Field, Item, Path, RichData, TextSpan
from .signal import Signal

EMAILS_FEATURE_NAME = 'emails'

# This regex is a fully RFC 5322 regex for email addresses.
# https://uibakery.io/regex-library/email-regex-python
EMAIL_REGEX = (
    "(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21\\x23-\\x5b\\x5d-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21-\\x5a\\x53-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])+)\\])"
)


class PIISignal(Signal):
  """Find personally identifiable information (emails, phone numbers, etc)."""
  name = 'pii'
  enrichment_type = EnrichmentType.TEXT

  @override
  def fields(self, input_column: Path) -> Field:
    return Field(
        fields={
            EMAILS_FEATURE_NAME:
                Field(repeated_field=Field(dtype=DataType.STRING_SPAN, refers_to=input_column))
        })

  @override
  def compute(self,
              data: Optional[Iterable[RichData]] = None,
              keys: Optional[Iterable[str]] = None,
              vector_store: Optional[VectorStore] = None) -> Iterable[Optional[Item]]:
    if data is None:
      raise ValueError('"data" is required for TextStatistics.compute().')
    if keys:
      raise ValueError('"keys" is not supported for TextStatistics.compute().')
    for text in data:
      if not isinstance(text, str):
        yield None
        continue

      yield {
          EMAILS_FEATURE_NAME: [
              TextSpan(start=m.start(0), end=m.end(0)) for m in re.finditer(EMAIL_REGEX, text)
          ]
      }
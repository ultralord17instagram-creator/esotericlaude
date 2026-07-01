# ═══════════════════════════════════════════════════════════════════════════════
# domain/value_objects/__init__.py — Value Objects оффера
#
# МОЖНО МЕНЯТЬ: добавляй Value Objects своей предметной области.
#
# Value Object — неизменяемый объект, определяемый своими значениями (не id).
# Используй @dataclass(frozen=True) для иммутабельности.
#
# Примеры:
#   @dataclass(frozen=True)
#   class Price:
#       amount: Decimal
#       currency: str = "RUB"
#
#   @dataclass(frozen=True)
#   class EmailAddress:
#       value: str
#       def __post_init__(self):
#           if "@" not in self.value:
#               raise ValueError(f"Invalid email: {self.value}")
# ═══════════════════════════════════════════════════════════════════════════════

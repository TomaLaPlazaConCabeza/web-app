class CoordSystemInconsistency(ValueError):
    pass


class TooLargeArea(OverflowError):
    pass


class OutsideSupportedArea(LookupError):
    pass


class NotAPolygon(ValueError):
    pass

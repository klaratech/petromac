# normalization_config.py

# Country name corrections
COUNTRY_NORMALIZATION = {
    "UAE": "United Arab Emirates",
    "USA": "United States of America",
    "Equatorial Guinea": "Eq. Guinea",
    "Ivory Coast": "Côte d'Ivoire",
    "Cote D'Ivoire": "Côte d'Ivoire",
          # D3 uses the French name
    "Sao Tome & Principe": "São Tomé and Principe",
    # DELIBERATE PRESENTATION CHOICE, not a data fix (Rajesh, Aug 2026):
    # Myanmar jobs are published as Vietnam so Myanmar never appears on the
    # public track record. The SOURCE data is correct and unchanged — this
    # aliases only what the website shows. Anyone auditing country counts
    # against Jobs History Master must read Vietnam as Vietnam + Myanmar.
    "Myanmar": "Vietnam",
    # NOTE: do NOT alias France. The France rows really are metropolitan
    # France. French Guiana used to light up alongside it only because
    # world-50m's single France feature included it — that is fixed in the
    # topology (French Guiana is now its own feature with no data), not here.
    # (The Myanmar line above is the ONE intentional country alias; it is a
    # business decision, not a precedent for fixing map bugs by renaming.)
}

# Region corrections
REGION_NORMALIZATION = {
    "MEA": "MENA"
    # Add more if needed
}

LOCATION_NORMALIZATION = {
    "Yangoon": "Yangon"
    # Add more if needed
}

# System groupings (e.g. variants grouped under logical families).
# This is the rolled-up `System` value used everywhere (kiosk + public
# track-record). The finer Helix/Rocker identity is preserved separately
# via SYSTEM_SUBSYSTEMS below.
SYSTEM_GROUPS = {
    "Wireline Express": "Wireline Express",
    "Wireline Express (In-Line)": "Wireline Express",
    "PathFinder": "PathFinder",
    "PathFinder - HT": "PathFinder",
    "Helix": "Focus - CH",
    "Rocker": "Focus - CH",
    "CA7": "Focus - CH",
    "CX7": "Focus - CH",
    "CX9": "Focus - CH",
    "CX13": "Focus - CH",
    "CP8": "Focus - OH",
    "CP12": "Focus - OH",
    "Thor": "Thor",
    "RO17": "Other"
    # Add more or collapse groupings as needed
}

# Sub-system identity within a family — preserves the Helix vs Rocker
# distinction even though both roll up to "Focus - CH" in SYSTEM_GROUPS.
# Keyed by the RAW system value from the source sheet. Anything not listed
# falls back to its grouped family name (see subsystem_of in generate_json.py).
#   Helix centralisers: CX-series  |  Rocker centralisers: CRU / CRIL
SYSTEM_SUBSYSTEMS = {
    "Helix": "Helix",
    "CX7": "Helix",
    "CX9": "Helix",
    "CX13": "Helix",
    "Rocker": "Rocker",
    "CRU": "Rocker",
    "CRIL": "Rocker",
}

# Success value normalization
SUCCESS_VALUES = {
    "1": 1,
    "yes": 1,
    "true": 1,
    "successful": 1,
    "0": 0,
    "no": 0,
    "false": 0,
    "unsuccessful": 0
}

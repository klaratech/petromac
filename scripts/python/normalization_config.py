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
    # NOTE: do NOT alias France. The France rows really are metropolitan
    # France. French Guiana used to light up alongside it only because
    # world-50m's single France feature included it — that is fixed in the
    # topology (French Guiana is now its own feature with no data), not here.
    #
    # Nothing here should ever alias one real country to a DIFFERENT real
    # country. Hiding a country is a separate, honest operation — see
    # EXCLUDED_COUNTRIES below.
}

# Countries withheld from everything the website publishes: their rows are
# dropped before any artifact is written, so they appear in no map, chip,
# tooltip, Top-5 panel or headline number.
#
# Myanmar (Rajesh, Aug 2026): Petromac does not want this work shown
# publicly. It was briefly published as Vietnam instead; that was reverted
# the same day because it made the map claim deployments in a country where
# they did not happen. Suppressing is the honest form of the same decision —
# every country the site DOES show keeps a true count, and the totals simply
# describe a smaller dataset. Expect the published country count and
# deployment total to sit BELOW Jobs History Master by exactly the excluded
# rows; that gap is this list, not a pipeline fault.
EXCLUDED_COUNTRIES = {
    "Myanmar",
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

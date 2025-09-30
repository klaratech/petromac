# normalization_config.py

# Country name corrections
COUNTRY_NORMALIZATION = {
    "UAE": "United Arab Emirates",
    "USA": "United States of America",
    "Equatorial Guinea": "Eq. Guinea",
    "Ivory Coast": "Côte d'Ivoire", 
          # D3 uses the French name
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

# System groupings (e.g. variants grouped under logical families)
SYSTEM_GROUPS = {
    "Wireline Express": "Wireline Express",
    "Wireline Express (In-Line)": "Wireline Express",
    "PathFinder": "PathFinder",
    "PathFinder - HT": "PathFinder",
    "Helix": "Focus - CH",
    "Rocker": "Focus - CH",
    "CA7": "Focus - CH",
    "CP8": "Focus - OH",
    "CP12": "Focus - OH",
    "Thor": "Thor",
    "RO17": "Other"
    # Add more or collapse groupings as needed
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

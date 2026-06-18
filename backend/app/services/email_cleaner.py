import re
from html.parser import HTMLParser

class HTMLTextStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs = True
        self.text_parts = []
        self.in_style = False
        self.in_script = False

    def handle_starttag(self, tag, attrs):
        if tag == 'style':
            self.in_style = True
        elif tag == 'script':
            self.in_script = True

    def handle_endtag(self, tag):
        if tag == 'style':
            self.in_style = False
        elif tag == 'script':
            self.in_script = False

    def handle_data(self, data):
        if not self.in_style and not self.in_script:
            self.text_parts.append(data)

    def get_text(self) -> str:
        return "".join(self.text_parts)

def clean_email_body(raw_body: str) -> str:
    """
    Cleans raw HTML/Text email content to produce clean, minimal text.
    Removes HTML tags, CSS styling, javascript blocks, footers, unsubscribe links, and excessive spacing.
    """
    if not raw_body:
        return ""

    # 1. If content looks like HTML, strip tags using HTMLTextStripper
    if "<html" in raw_body.lower() or "<body" in raw_body.lower() or "<div" in raw_body.lower() or "<p" in raw_body.lower():
        try:
            stripper = HTMLTextStripper()
            stripper.feed(raw_body)
            text = stripper.get_text()
        except Exception:
            # Fallback to simple regex strip if parser fails
            text = re.sub(r'<[^>]+>', ' ', raw_body)
    else:
        text = raw_body

    # 2. Split into lines to filter footers, signatures, and unsubscribe text
    lines = text.splitlines()
    cleaned_lines = []
    
    # Common words in footers we want to exclude to save token cost
    footer_patterns = [
        r"unsubscribe",
        r"subscription preferences",
        r"this email was sent to",
        r"all rights reserved",
        r"privacy policy",
        r"terms of service",
        r"do not reply to this",
        r"please do not reply",
        r"contact us at",
        r"confidentiality notice",
        r"this email and any files transmitted"
    ]
    
    in_footer_or_signature = False
    
    for line in lines:
        line_stripped = line.strip()
        if not line_stripped:
            continue
            
        # Detect start of footer / signature
        # Long lines of dashes or stars
        if re.match(r'^[-_*=]{5,}$', line_stripped):
            in_footer_or_signature = True
            continue
            
        # Detect signatures
        if line_stripped.lower() in ["best regards,", "thanks,", "sincerely,", "warm regards,", "regards,", "thank you,"]:
            in_footer_or_signature = True
            continue
            
        # Check against footer pattern matching
        matches_footer = False
        for pattern in footer_patterns:
            if re.search(pattern, line_stripped.lower()):
                matches_footer = True
                break
                
        if matches_footer:
            # Skip this line and assume subsequent lines might be footer as well (if close to end)
            continue
            
        if not in_footer_or_signature:
            cleaned_lines.append(line_stripped)
            
    # Reassemble and collapse multiple empty lines / whitespaces
    cleaned_text = "\n".join(cleaned_lines)
    cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
    cleaned_text = re.sub(r'[ \t]+', ' ', cleaned_text)
    
    return cleaned_text.strip()

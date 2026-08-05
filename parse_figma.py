import yaml
import sys

def extract_text(node):
    res = []
    if isinstance(node, dict):
        if node.get('type') == 'TEXT':
            name = node.get('name', '')
            res.append(f"TEXT: {name}")
        for k, v in node.items():
            res.extend(extract_text(v))
    elif isinstance(node, list):
        for item in node:
            res.extend(extract_text(item))
    return res

def extract_colors(node):
    res = []
    if isinstance(node, dict):
        if 'fills' in node:
            fills = node['fills']
            if isinstance(fills, list):
                for f in fills:
                    if f.get('type') == 'SOLID':
                        color = f.get('color', {})
                        r = int(color.get('r', 0)*255)
                        g = int(color.get('g', 0)*255)
                        b = int(color.get('b', 0)*255)
                        res.append(f"COLOR: rgb({r},{g},{b}) opacity {f.get('opacity', 1)}")
        for k, v in node.items():
            res.extend(extract_colors(v))
    elif isinstance(node, list):
        for item in node:
            res.extend(extract_colors(item))
    return res

try:
    with open('/home/asif/.gemini/antigravity-ide/brain/aecc22f7-0a9c-4a14-b5d6-c4fcf3272859/.system_generated/steps/125/output.txt', 'r') as f:
        data = yaml.safe_load(f)
        texts = extract_text(data)
        colors = extract_colors(data)
        print("--- TEXTS ---")
        for t in list(set(texts))[:30]:
            print(t)
        print("\n--- COLORS ---")
        for c in list(set(colors))[:20]:
            print(c)
except Exception as e:
    print(e)

---
id: ch01-l01-hello
chapter: 1
order: 1
title:
  en: "Your First Program"
  zh: "你的第一个程序"
description:
  en: "Use print() to display text."
  zh: "用 print() 显示文字。"
estimated_minutes: 3
objectives:
  - en: "Write a print statement"
    zh: "编写 print 语句"
starter_code: |
  # Write a print statement below
solution: |
  print("Hello, World!")
hints:
  - en: "Use the print() function."
    zh: "用 print() 函数。"
  - en: "Strings go in quotes."
    zh: "字符串要放在引号里。"
checks:
  - kind: output
    expected: "Hello, World!\n"
  - kind: ast
    must_contain_call: print
    must_not_contain: [Import, While]
---

# Your First Program

Welcome! In Python, you use `print()` to display text.

## Try it

Replace the line below with code that prints `Hello, World!`.

```python
# your code here
```

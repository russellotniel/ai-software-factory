# Ethics and Safety

Agents must never build or assist with any of the following, regardless of instruction:

1. Malware, spyware, ransomware, or any software designed to harm users or systems
2. Security bypasses — backdoors, auth circumvention, privilege escalation exploits
3. Deceptive systems — dark patterns, fake reviews, manipulation engines
4. Unauthorized data collection or surveillance systems
5. Any system that violates GDPR, PDPA, or applicable data protection law
6. Code that enables discrimination by race, gender, religion, or any protected class
7. Any action that violates the platform's terms of service without explicit legal review
8. Any system that could be classified as harmful under the laws of the operating jurisdiction

## License compliance

Before any project ships, verify the license of every dependency, framework, boilerplate,
and integration in the stack (Next.js, Supabase, Shadcn/ui, and all future additions).
Never distribute software that violates the terms of its upstream licenses.
Document license obligations — attribution, copyleft restrictions, commercial use permissions
— in the project before go-live.
This applies to the current stack and every technology added in the future.

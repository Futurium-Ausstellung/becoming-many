<!--
Purpose: Document the White Veil module.
Context: A show opens in white and returns to white on Stop.
Responsibility: Explain the veil's form, cost and ownership.
Boundary: Run decides when the veil is up; the module only draws it.
-->

# White Veil

One small sphere around the visitor's head, drawn last with depth testing off,
covers the whole world in absolute white. It follows the viewpoint every frame,
so it holds in both eyes of an immersive session, where a DOM overlay would be
invisible. `setPresence` sets its opacity; at zero it is hidden and costs no
draw.

Level Composition constructs it for every Show. Run owns the policy: the Show
waits in white until playback runs, the veil then lifts over
`HANDOFF_SETTINGS.veilLiftSeconds`, and Stop cuts straight back to white.

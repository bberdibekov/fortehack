class IntentTriggers:
    DEFINITIONS = {
        "GENERATE_ARTIFACTS": {
            "en": ["create", "design", "draft", "generate", "flow"],
            "es": ["crear", "diseñar", "generar", "flujo"],
            "fr": ["créer", "générer", "flux"]
        },
        "RESET_CONTEXT": {
            "en": ["reset", "clear", "restart"],
            "es": ["reiniciar", "limpiar"],
            "fr": ["réinitialiser"]
        }
    }

    @staticmethod
    def get_triggers(intent: str, lang: str) -> list:
        return IntentTriggers.DEFINITIONS.get(intent, {}).get(lang, [])
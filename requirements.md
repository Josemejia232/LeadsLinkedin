# Interventoría Laravel - Requirements

## Post Detail View (Segundo Nivel)

Cada publicación generada debe tener una vista de detalle expandible o modal que muestre:

- **Contenido generado** (`text_content`)
- **Hashtags** (`hashtags`)
- **Call to Action** (`call_to_action`)
- **Imagen**: ícono para cargar/subir imagen directamente desde la vista del post

## Auto-generación de Contenido, CTA y Hashtags

Si una publicación no tiene contenido (`text_content`), debe detectarlo y generar:
- **Call to Action** automático basado en el título y tema del post

Si una publicación no tiene CTA (`call_to_action`) ni Hashtags (`hashtags`), debe generarlos automáticamente:
- **Call to Action**: una pregunta o invitación a comentar relacionada al tema
- **Hashtags**: 5-10 hashtags relevantes separados por espacio

La generación debe ocurrir al entrar a la vista de detalle del post y detectar que faltan estos campos.

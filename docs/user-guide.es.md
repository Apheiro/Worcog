<!-- Traducción de docs/user-guide.md. Mantener ambas versiones sincronizadas. -->

Worcog reúne temas, tareas, referencias, contactos y archivos administrados en
un único espacio de trabajo local. Esta guía describe los controles disponibles
en la aplicación. Se incluye con Worcog y puede leerse sin conexión a internet.

Documentación sigue el idioma elegido en **Ajustes → General → Idioma**. La guía
en inglés y su traducción al español están incluidas sin conexión; al cambiar
el idioma también cambia la guía de inmediato.

Worcog utiliza sus propios datos y preferencias de aplicación. Para traer un
espacio de trabajo existente, usá **Ajustes → Almacenamiento y copias de
seguridad → Importar / restaurar**.

## Índice

- [Primeros pasos](#primeros-pasos)
- [Resumen](#resumen)
- [Temas](#temas)
- [Tareas y subtareas](#tareas-y-subtareas)
- [Vínculos entre temas y tareas](#vinculos-entre-temas-y-tareas)
- [Recordatorios y bandeja del sistema](#recordatorios-y-bandeja-del-sistema)
- [Avances de las tareas](#avances-de-las-tareas)
- [Recursos y fuentes](#recursos-y-fuentes)
- [Archivos administrados](#archivos-administrados)
- [Seleccionar y exportar adjuntos](#seleccionar-y-exportar-adjuntos)
- [Editar documentos](#editar-documentos)
- [Contactos, responsables y solicitantes](#contactos-responsables-y-solicitantes)
- [Historial y cronología del tema](#historial-y-cronologia-del-tema)
- [Archivo y eliminación permanente](#archivo-y-eliminacion-permanente)
- [Ajustes, colores y apariencia](#ajustes-colores-y-apariencia)
- [Copias de seguridad, exportación y restauración](#copias-de-seguridad-exportacion-y-restauracion)
- [Actualizaciones de la aplicación](#actualizaciones-de-la-aplicacion)
- [Atajos de teclado y navegación](#atajos-de-teclado-y-navegacion)
- [Almacenamiento, privacidad y solución de problemas](#almacenamiento-privacidad-y-solucion-de-problemas)

## Primeros pasos

1. Abrí la aplicación de escritorio. Una vista previa en el navegador puede
   mostrar la interfaz, pero guardar datos, adjuntar archivos y crear copias de
   seguridad requiere la aplicación de escritorio.
2. Elegí **Nuevo tema** desde Resumen o Temas. Asignale un título y, si hace
   falta, una categoría, responsables y un solicitante.
3. Abrí el tema y elegí **+ Tarea**. Las tareas heredan su tema automáticamente;
   las subtareas también heredan su tarea principal.
4. Agregá referencias o documentos en **Recursos** dentro de la tarea y guardá.
5. Completá las tareas con su casilla. Usá **Agregar avance** para registrar
   progreso o **Bloqueada** para registrar un impedimento.

Los registros guardados y los documentos administrados se almacenan en este
dispositivo. La selección de archivos para exportar y los hilos de tareas
desplegados son estados temporales de la interfaz; no reemplazan el guardado
del trabajo ni las copias de seguridad.

Cambiá de vista desde la barra lateral. La navegación actualiza la vista sin
recargar la aplicación ni volver a abrir la base de datos local.

## Resumen

Resumen muestra las tareas abiertas, vencidas y bloqueadas, junto con los temas
en curso. Hacé clic en una métrica para abrir la vista correspondiente con ese
filtro. **Necesita atención** destaca las tareas bloqueadas, las fechas límite
vencidas y los próximos vencimientos. Actividad reciente abre el tema asociado.

Usá **Nuevo tema** para empezar un asunto. Resumen ofrece una síntesis;
**Historial** muestra una cronología más amplia de los movimientos registrados
en el espacio de trabajo.

## Temas

Un tema agrupa tareas, fuentes, archivos y su cronología. Crealo desde
**Temas → Nuevo tema** o desde Resumen. Hacé clic en su título para abrirlo.

### Campos de un tema

- **Título:** identifica el asunto.
- **Estado:** define el estado general del tema. Archivar es una acción aparte.
- **Responsables:** una o más personas a cargo del tema.
- **Solicitante:** el contacto que solicitó el trabajo. Es un único contacto
  opcional e independiente de los responsables.
- **Categoría:** buscá una categoría existente o escribí un nombre para crearla.
  El control de color contiguo define el color del texto de esa categoría en
  todos los temas.
- **Campos avanzados:** contiene Fecha inicial, Resumen, Prioridad y Fecha
  objetivo. Al elevar la prioridad por encima de Normal, la fecha objetivo
  aparece como **Fecha límite** fuera de la sección avanzada.

Eliminar una categoría la quita de los temas afectados después de confirmar y
guardar el formulario. No elimina los temas.

### Espacio del tema y organización

Usá el menú **…** para editar o eliminar el tema. **Archivar** sigue siendo un
botón aparte. El resumen actual solo aparece si el tema tiene uno. Los archivos
generales del tema se muestran como adjuntos compactos debajo de esa zona;
**Adjuntar archivo** agrega uno directamente al tema.

Las pestañas del tema son **Tareas**, **Fuentes**, **Archivos** y **Cronología**.
Archivos incluye los documentos asociados al tema y su trabajo. Usá **+ Tarea**
para crear una tarea principal dentro del tema actual.

En la lista de Temas, la búsqueda y los filtros reducen los resultados.
**Ordenar por** permite ordenarlos por última actualización, fecha objetivo,
prioridad o nombre. **Agrupar por** ofrece categoría, solicitante, prioridad,
estado, fecha de creación, última actualización y fecha límite. Los grupos de
solicitante reúnen el mismo nombre sin distinguir mayúsculas, conservan el
nombre visible del contacto y ubican al final los temas sin solicitante bajo
**Sin solicitante**. Al agrupar por categoría, esta se muestra en el encabezado
del grupo y no se repite en cada fila. Las preferencias de agrupación y orden
se guardan en este dispositivo.

Las tablas agrupadas comparten los mismos anchos de columna, por lo que estado,
prioridad, responsables y fechas quedan alineados entre grupos, sin importar
su contenido.

Con **Ajustes → General → Menús contextuales** activado, hacé clic derecho en
una fila para Editar tema, Archivar/Desarchivar o Eliminar tema, también en las
listas agrupadas. Archivar y eliminar conservan sus diálogos de confirmación.
Enfocá una fila o su título y presioná **Shift + F10** o la **tecla Menú** para
acceder con el teclado. En dispositivos táctiles, mantené presionado. Hacer
clic izquierdo en el título sigue abriendo el tema.

Con Menús contextuales desactivado, cada fila muestra un botón **…** en el
extremo derecho con las mismas acciones. Ambos modos funcionan en listas
agrupadas y sin agrupar.

El menú **Archivo** admite las mismas acciones y la misma preferencia de menú
contextual. Abrí un tema archivado y elegí **Desarchivar**, o usá esa opción en
el menú de su fila. Confirmá para devolverlo a Temas conservando su contenido.
Al desarchivar desde el detalle de Archivo, volvés a la lista de archivados.

### Indicador de color del tema

La barra fina utiliza los colores Inicial, Intermedio y Final configurados en
Ajustes. Sin fecha objetivo, representa el tiempo desde la última actividad del
tema en relación con el período de inactividad configurado. Los cambios en sus
tareas y recursos también actualizan la actividad del tema.

Los días elegidos en **Ajustes → General → Inactividad de los temas → Pausar la
inactividad los** no se suman. La barra se pausa durante cada día excluido,
según la hora local, y continúa en los días que sí cuentan. El texto al pasar
el cursor informa los días contados cuando hay exclusiones configuradas.

Si el tema tiene una fecha objetivo, la barra representa el tiempo transcurrido
desde su Fecha inicial hasta el final del día objetivo. Si no tiene Fecha
inicial, se usa el momento de creación. El período de inactividad configurado
no interviene en este cálculo, pero los colores configurados sí se aplican.
Pasá el cursor sobre el indicador para ver la explicación de fecha o inactividad.

## Tareas y subtareas

Creá tareas principales desde **+ Tarea** en el tema. Creá una subtarea desde
**… → Agregar subtarea** en su tarea principal. Cada tarea tiene su propia
tarjeta dentro de un árbol; las subtareas siguen asociadas a su principal.
Hacé clic en el título de una tarea para editarla.

Los campos incluyen Título, Prioridad, Fecha límite, Responsables y Recursos.
**Campos avanzados** contiene Descripción, Fecha inicial y Repetir. El momento
de creación se registra automáticamente y las tareas nuevas comienzan con la
fecha de hoy como Fecha inicial; no necesitás ingresar una fecha de creación.

### Completar, bloquear y consultar descripciones

- Una tarea nueva sin completar está **En curso**. No hay selector de estado
  para las tareas.
- Usá la casilla para completarla. Desmarcarla la devuelve a En curso.
  Completar no genera una notificación de éxito.
- Usá **… → Bloqueada** para bloquearla. El motivo es obligatorio. El icono de
  advertencia lo muestra al pasar el cursor o enfocarlo con el teclado.
- Usá **… → Desbloquear** para retomar el trabajo. Las tareas completadas no
  pueden bloquearse.
- Si la tarea tiene una descripción, aparece un icono. Pasá el cursor o enfocalo
  para leerla sin abrir el editor.

Los iconos aparecen en este orden: advertencia de bloqueo, avances,
descripción y **…**. El menú se abre al pasar el cursor y también funciona con
clic o teclado. Agrupa Vincular, Agregar avance, Agregar subtarea, Eliminar y
Bloqueada / Desbloquear.

De forma predeterminada, el menú de tres puntos verticales (⋮) ofrece las
acciones secundarias. Activá **Ajustes → General → Menús contextuales** para
reemplazarlo por un menú de clic derecho sobre la tarjeta. Ofrece las mismas
acciones de Vincular, Agregar avance, Agregar subtarea, Eliminar y
Bloqueada/Desbloquear. Enfocá la tarjeta o uno de sus controles y usá el atajo
configurado de **Abrir menú de acciones** —por defecto **Shift + F10**— o la
**tecla Menú**. En pantallas táctiles, mantené presionado. Esta preferencia del
dispositivo está desactivada por defecto. Desactivarla muestra nuevamente los
botones de tres puntos en las tarjetas y filas de temas en lugar de las
acciones de clic derecho. Los controles del encabezado del tema siguen disponibles.

### Fechas límite, orden y visibilidad

Una tarea con fecha límite muestra una pequeña píldora de color debajo de su
casilla. Usa los colores Inicial, Intermedio y Final configurados, según el
tiempo transcurrido desde la creación hasta el final del día límite. Completar
la tarea congela su progreso en el momento de finalización registrado, usando
los colores configurados. Reabrirla retoma el cálculo según la hora actual.
Las tareas sin fecha límite no muestran la píldora. La fecha, con la indicación
Vencida cuando corresponde, aparece debajo de las acciones.

**Ordenar por** ofrece Libre, fecha de creación de más antiguas o más recientes
primero, fecha límite, prioridad y nombre. Las tareas principales permanecen
antes de sus descendientes visibles; el orden se aplica a las raíces y entre
hermanas. Ordenar por fecha de creación evita movimientos causados solamente
por editar una tarea. El criterio elegido se guarda en este dispositivo.

Pasá el cursor o enfocá una tarjeta para revelar su control de arrastre, que
sale desde detrás del borde derecho. En dispositivos táctiles permanece visible.
Usalo para arrastrar la tarea en la página Tareas o en la pestaña Tareas de un
tema. Soltala sobre otra tarjeta para convertirla en subtarea; el destino se
resalta y muestra una indicación antes de soltar. Al arrastrar una subtarea,
**Convertir en tarea principal** quita su relación con la principal. Las
subtareas más profundas también ofrecen **Subir un nivel**. Mover una principal
arrastra a sus descendientes. Los movimientos se mantienen dentro del mismo
tema y una tarea no puede convertirse en descendiente de sí misma.

En **Libre**, las líneas finas de inserción permiten reordenar tareas hermanas,
incluidas las principales, sin anidarlas. El orden manual se guarda en el
espacio de trabajo independientemente del criterio seleccionado. Cambiar de
criterio y volver a Libre lo recupera. Las tareas nuevas y las movidas a otro
grupo fuera de Libre aparecen después de las tareas ordenadas manualmente de
ese grupo. Reordenar dentro del mismo nivel se ignora fuera de Libre: no aparece
una línea de inserción ni se sobrescribe el orden manual guardado. Los cambios
de jerarquía siguen disponibles en todos los modos. Las tareas ocultas o
filtradas conservan su orden guardado.

Para arrastrar con el teclado, enfocá el control y presioná **Espacio** o
**Enter**. Usá las flechas para moverte sobre un destino y Espacio o Enter para
soltar. **Escape** cancela. El destino resaltado describe la acción pendiente.

**Ocultar completadas** oculta únicamente las tareas principales completadas.
Las subtareas pueden seguir apareciendo aunque se oculte su principal
completada. Los demás filtros activos siguen aplicándose. La página Tareas
ofrece las vistas Abiertas, Todas, Vencidas y Bloqueadas.

### Tareas recurrentes

Elegí Diaria, Semanal o Mensual en **Campos avanzados → Repetir** y agregá una
fecha límite. Cada repetición es una tarea independiente. Worcog genera las
repeticiones que corresponden al cargar o guardar el espacio de trabajo.
Repetir controla la generación de tareas; las alertas de recordatorio se
programan por separado en cada tarea. Las repeticiones generadas no heredan la
fecha absoluta del recordatorio original.

Eliminar una tarea de una serie recurrente elimina la serie, como explica la
confirmación, para que las repeticiones eliminadas no vuelvan a crearse.

## Vínculos entre temas y tareas

Usá **⋮ → Vincular…**, o el menú de clic derecho si está activado, en una tarea
o fila de tema para iniciar un vínculo. El encabezado del tema también ofrece
**Vincular…**. Una barra identifica el origen. Hacé clic en la tarjeta de
la tarea, la fila del tema o el título del espacio del tema de destino para
guardar la conexión. Los destinos válidos se resaltan al pasar el cursor; no
podés volver a seleccionar el origen ni elementos ya vinculados.

Podés navegar entre vistas y temas sin salir del modo de vinculación. En una
fila de tema, usá la pequeña flecha **Abrir tema para elegir una tarea**, junto
al título, para abrir ese tema en vez de vincularlo. Después hacé clic en la
tarea deseada. Elegí **Cancelar** en la barra o presioná **Escape** para salir
sin crear una conexión. Con el teclado, avanzá con Tab hasta un destino y
presioná **Enter** o **Espacio**. Si falla el guardado, el modo de selección
permanece disponible para reintentar.

Las conexiones funcionan entre tareas, entre temas o entre una tarea y un tema,
incluso de temas distintos. Registran **anterior → siguiente**: el elemento
desde el que elegís Vincular es el anterior u origen, y el destino seleccionado
es el siguiente. Ambos extremos muestran la conexión. Las referencias usan una
flecha izquierda para vínculos entrantes y derecha para salientes, sin prefijos
de texto Anterior/Siguiente. Pasá el cursor o enfocá una referencia para conocer
su dirección y destino. Esto registra precedencia sin modificar automáticamente
las relaciones principal/subtarea, el tema, el orden ni los estados de
finalización o bloqueo. Para corregir la dirección, desvinculá los elementos y
creá la relación desde el otro extremo; la relación inversa no puede agregarse
como una conexión duplicada.

Los elementos vinculados aparecen debajo de los metadatos del tema en la lista
y debajo del encabezado del espacio del tema. Las referencias de tareas debajo
de sus adjuntos están ocultas por defecto; activá **Ajustes → General → Mostrar
relaciones entre tareas** para verlas. El punto de conexión de la tarea sigue
disponible en ambos modos. Hacé clic en una referencia para abrir su tema o el
editor de su tarea. El pequeño control **Desvincular** elimina solo la conexión,
conservando los dos elementos y sus recursos.

Las tareas con conexiones muestran un punto en su borde izquierdo. Pasá el
cursor o enfocalo para mostrar curvas finas discontinuas hacia las tareas
relacionadas visibles en la misma lista y resaltar sus bordes. Las flechas
apuntan al elemento siguiente, sin importar cuál de los extremos estés
señalando. Hacé clic para mantener visibles las conexiones y abrir una lista
de elementos vinculados. Estas referencias también permiten llegar a elementos
de otros temas, ocultos por filtros o dentro de ramas plegadas; las curvas
solo se dibujan cuando ambas tarjetas están visibles. Las conexiones usan un
margen izquierdo separado del árbol de líneas continuas entre principales y
subtareas. Cerrá el desplegable para liberar la selección.

Los vínculos se guardan con el espacio de trabajo local y se incluyen en las
copias de seguridad y exportaciones. Eliminar un extremo quita sus conexiones
sin eliminar el otro. Las conexiones existentes creadas mediante Vincular
conservan su origen y destino registrados. Las relaciones antiguas entre temas
sin dirección conocida usan un icono neutro, sin flecha; desvinculalas y volvé
a crearlas para asignarles precedencia.

## Recordatorios y bandeja del sistema

Tanto **Icono en la bandeja** como **Notificaciones de recordatorios** están
**desactivados por defecto**. Activalos, en ese orden, en **Ajustes → General →
Bandeja y recordatorios**. Intentar activar el recordatorio de una tarea antes
de habilitar ambas opciones muestra una alerta con el requisito y mantiene el
recordatorio desactivado. La capa nativa de guardado también exige este requisito.

### Programar un recordatorio

1. Creá o editá una tarea sin completar y activá **Recordatorio**.
2. Elegí una **Fecha y hora del recordatorio** futura y guardá la tarea.
3. La hora del recordatorio es independiente de la fecha límite y se ingresa
   y muestra según tu hora local. Se guarda como un instante absoluto: cambiar
   de zona horaria no cambia el momento programado.

Desactivar Recordatorio y guardar quita la programación de esa tarea. Editar
otros campos conserva una programación existente, incluso vencida. Si el
recordatorio fue descartado, el formulario lo indica; cambiá su fecha por una
futura para programarlo otra vez. Reabrí una tarea completada antes de asignarle
un nuevo recordatorio.

### Alertas persistentes

Cuando vence un recordatorio, Worcog abre su propia ventana compacta en el
extremo inferior derecho del monitor de la ventana principal, dentro del área
de trabajo del monitor. Permanece por encima de las ventanas normales y no pide
el foco del teclado al aparecer. Las listas largas se desplazan dentro de ella.
Son **ventanas de Worcog**, no avisos del centro de notificaciones de Windows,
y también funcionan con la aplicación portable.

Cada alerta muestra el tema, la tarea y la hora programada. Hacé clic en su
contenido para restaurar Worcog y abrir la tarea. Si ya hay un formulario o un
guardado en curso, Worcog pide que lo termines en lugar de descartarlo. Abrir
la tarea no cierra la alerta. Usá su **×** para descartarla explícitamente.
Las alertas no caducan y Escape / Alt+F4 no descarta toda la cola.

Un único sonido se repite mientras haya recordatorios pendientes; los
simultáneos no superponen varios sonidos. Descartar el último detiene el sonido
y oculta la ventana. El descarte se guarda con la tarea, por lo que volver a
abrir Worcog no repite un recordatorio ya reconocido. Ajustes también muestra
los pendientes con controles para abrirlos o descartarlos. Si la ventana
independiente no puede mostrarse, Worcog restaura la principal y ofrece allí
controles alternativos para descartarlos.

Completar o cancelar una tarea reconoce su recordatorio actual. Eliminar la
tarea o su recordatorio también quita la alerta. Los temas archivados,
completados o cancelados pausan los recordatorios de sus tareas; los vencidos
pueden reaparecer cuando el tema vuelve a estar activo. Desactivar las
notificaciones pausa la programación existente y detiene alertas y sonido sin
eliminar los horarios. Desactivar la bandeja también desactiva las
notificaciones. Volver a habilitar ambas opciones permite que reaparezcan los
recordatorios vencidos que no se hayan descartado.

### Bandeja y permanencia de la aplicación

Con Icono en la bandeja activado, minimizar **o cerrar** la ventana principal
la oculta mientras Worcog sigue ejecutándose. Hacé clic en el icono o elegí
**Open Worcog** en su menú para restaurarla. **Exit** cierra por completo y pide
confirmación si hay un formulario, documento u operación abiertos; guardá los
cambios antes. Desactivar la bandeja restaura la ventana principal. Con la
función desactivada, se mantiene el comportamiento normal de minimizar y cerrar.

Solo se ejecuta un proceso para esta identidad de aplicación. Abrirla de nuevo
restaura la instancia existente y evita motores de recordatorios duplicados.

El reloj y audio nativos de recordatorios no dependen de una pestaña visible.
Los vencimientos se revisan aproximadamente cada dos segundos mientras el
proceso está activo. Después de suspender el equipo o reiniciar la aplicación,
se detectan nuevamente los vencidos sin descartar. Worcog no despierta un equipo
suspendido o apagado, no se inicia automáticamente con la sesión ni genera
alertas cuando está cerrado por completo. La programación depende del reloj del
sistema: mantené correcta la fecha y hora del equipo.

### Configurar el sonido

En **Ajustes → General → Bandeja y recordatorios**, elegí un audio personalizado
o **Usar predeterminado** para recuperar el tono incluido. El tono predeterminado
es un pulso breve y suave con pausas que se repite mientras haya alertas pendientes.

**Elegir audio…** acepta WAV, MP3, OGG y FLAC, hasta **10 MiB / 60 segundos**,
mono o estéreo y hasta **96 kHz**. Worcog valida el audio y conserva su propia
copia; mover el original no rompe los recordatorios. Un sonido personalizado
se repite tal como está: incluí en el archivo los intervalos de silencio deseados.
**Probar** reproduce hasta cinco segundos y **Detener prueba** la detiene. La
prueba está disponible al configurar funciones desactivadas, pero se deshabilita
si están sonando recordatorios reales. Detener una prueba no silencia los pendientes.

El volumen se ajusta entre 1 y 100%, con un valor inicial de 25%. También se
aplican el volumen, el silencio y el dispositivo de salida del sistema operativo.
Si el archivo personalizado falta o no se puede leer, Worcog informa el problema
y usa el tono predeterminado. Si la salida de audio no está disponible o se
interrumpe, las alertas visuales permanecen; Worcog informa el error y reintenta
el audio. Siempre se puede descartar la alerta.

Los ajustes de bandeja y recordatorios y los sonidos personalizados pertenecen
a este dispositivo y no se incluyen en los archivos del espacio de trabajo.
Los horarios y su estado de descarte sí se incluyen. Restaurar un archivo
recupera su estado de recordatorios, pero no activa automáticamente estas
funciones opcionales del dispositivo.

## Avances de las tareas

Elegí **… → Agregar avance**, ingresá una descripción y guardá. La aplicación
registra la fecha y hora automáticamente. Los avances documentan la evolución;
las subtareas dividen el trabajo en unidades menores. Registrar un avance no
completa la tarea.

Cuando una tarea tiene al menos un avance, su icono permite desplegar un hilo
separado entre la tarjeta principal y sus subtareas. Los avances tienen una
línea de tiempo vertical con fecha, hora y descripción en cada entrada, del
más reciente al más antiguo. No tienen tarjetas propias. Desplegar este
historial no despliega ni pliega las subtareas, y viceversa.

## Recursos y fuentes

En el formulario de creación o edición de una tarea, **Recursos** combina
fuentes y archivos adjuntos. Creá fuentes y vinculá o desvinculá recursos allí.
Para reutilizar uno existente, buscá explícitamente; una tarea nueva no lista
todo el catálogo. Hacé clic en una fuente de la tarea para consultar sus detalles
y abrir el enlace original, cuando tenga uno.

### Crear una fuente

Elegí Crear fuente dentro de Recursos, ingresá un título y seleccioná el tipo.
**Plataforma del sistema** es un selector con búsqueda que también permite
crear nombres. Las plataformas se muestran según el tipo de fuente elegido.

| Tipo | Campos de contexto disponibles |
| --- | --- |
| Correo | Asunto, Fecha, Remitente / destinatarios y Contexto |
| Tickets | Identificador del ticket, Enlace del ticket, Solicitante / contactos y Contexto |
| Reunión | Enlace de reunión / grabación, Fecha y hora de la reunión, Asistentes y Contexto |
| Mensajería | Enlace del mensaje / conversación, Fecha y hora, una identificación de conversación y Contexto |
| URL | URL externa HTTP/HTTPS obligatoria y Contexto opcional; sin campos de ticket, evento ni participantes |

En Mensajería, **Identificar conversación por** permite elegir Remitente,
Participantes o Nombre del grupo. Solo se muestra el campo elegido. Los campos
de fecha incluyen controles de hora local cuando admiten hora. Los enlaces de
fuentes pueden usar HTTP, HTTPS o Teams. El tipo URL requiere HTTP o HTTPS.
Arrastrar un enlace web a Recursos preselecciona URL; arrastrar un enlace de
Teams preselecciona Mensajería. Ingresá un título y agregá la fuente antes de
guardar la tarea.

Los iconos distinguen el tipo en listas de recursos, adjuntos de tareas,
formularios, detalles y cronologías: sobre para Correo, ticket para Tickets,
calendario para Reunión, burbujas de conversación para Mensajería y enlace para
URL. Las referencias antiguas sin tipo reconocido conservan el icono de enlace
general.

Terminá de agregar la fuente antes de guardar la tarea. Si un formulario de
recurso tiene un borrador pendiente, Worcog advierte y mantiene abierto el
formulario de la tarea hasta que agregues el recurso o descartes expresamente
su borrador. Guardar la tarea confirma conjuntamente sus relaciones con los
recursos. Cancelar descarta las cargas que todavía no se guardaron.

### Gestionar recursos

**Recursos** en la barra lateral separa **Fuentes** y **Archivos** en pestañas.
Buscá o filtrá para consultar metadatos e identificar las tareas que usan cada
recurso. Los detalles de fuentes permiten editar metadatos y abrir el enlace
original. Las vistas de gestión no crean nuevas relaciones con tareas.

Eliminar un nombre de Plataforma del sistema lo quita de las fuentes de ese
tipo después de confirmar y guardar. Las fuentes y sus vínculos con tareas se
conservan.

## Archivos administrados

Usá el selector de archivos o arrastralos al área Recursos del formulario de
una tarea. Worcog los copia a su directorio de adjuntos administrados; modificar
o eliminar el original fuera de Worcog no cambia esa copia. También podés
adjuntar archivos generales desde el espacio de un tema. Cada recurso vinculado
aparece una sola vez en el formulario, incluso mientras los archivos nuevos
pasan a ser recursos guardados.

La copia de archivos, las comprobaciones de disponibilidad y la lectura y
guardado de documentos se ejecutan en segundo plano para no bloquear la
ventana. Esperá a que termine la copia de un adjunto antes de guardar su formulario.

En la aplicación de escritorio también podés soltar uno o más archivos
sobre cualquier tarjeta de tarea visible, incluidas las subtareas. La tarjeta
resaltada es el destino. Worcog copia los archivos y los adjunta automáticamente
a esa tarea, sin abrir un formulario. Esto agrega recursos sin mover tareas ni
modificar su jerarquía. Si falla la copia o el guardado, se descartan las copias
sin guardar y se muestra un error. Si un formulario o confirmación cubre una
tarea, soltá los archivos en Recursos dentro del formulario o cerrá primero el diálogo.

Los adjuntos admitidos incluyen PDF, texto, Markdown, CSV, JSON, registros,
imágenes comunes, DOCX, XLSX, PPTX, ODT, ODS y ODP. Cada archivo puede tener
hasta **100 MiB**. No se aceptan ejecutables, scripts, accesos directos, HTML ni
archivos de Office con macros. Admitir un adjunto no implica que exista un
editor integrado para ese formato.

Hacé clic en un adjunto para abrirlo. Según el formato y la opción del editor,
se abre dentro de Worcog o con la aplicación predeterminada del sistema.
Los detalles del archivo en Recursos permiten consultar sus relaciones y
metadatos o eliminar la copia administrada.

Desvincular un archivo guardado de una tarea conserva su copia administrada.
Eliminar explícitamente el archivo quita esa copia y sus relaciones, pero
conserva el original fuera de Worcog. Si una copia administrada se elimina
manualmente, Worcog informa **Archivo no encontrado** o **Archivo inaccesible**
al intentar accederla, sin impedir el trabajo en otros elementos.

## Seleccionar y exportar adjuntos

Mantené presionado **Ctrl** en Windows o **Command** en macOS y hacé clic en un
adjunto de una tarjeta para seleccionarlo. Podés cambiar el modificador en
**Ajustes → General → Atajos de teclado**. Repetí el gesto para deseleccionarlo.
Los adjuntos seleccionados quedan resaltados; un clic normal sigue abriendo el
archivo. Las fuentes no son archivos adjuntos y no se incluyen en esta selección.

La selección puede abarcar tareas y temas y se conserva mientras navegás en la
sesión actual. **Exportar (N)** aparece abajo a la derecha junto a los documentos
minimizados. **×** limpia la selección.

1. Seleccioná los adjuntos que querés compartir.
2. Elegí **Exportar (N)** y un nombre nuevo de destino en el diálogo de guardado.
3. Con un solo archivo, Worcog genera una copia independiente. Con varios,
   crea un ZIP que contiene únicamente esos archivos, con sus nombres originales
   cuando son válidos. Los nombres repetidos reciben sufijos numéricos dentro
   del ZIP.
4. Enviá la copia o el ZIP por tu correo, chat o servicio de archivos habitual.

Los originales administrados permanecen en Worcog. No se sobrescriben archivos
de destino existentes. Cancelar o fallar conserva la selección; una exportación
correcta la limpia. Si algún seleccionado falta o es inaccesible, se detiene la
exportación con un error. El tamaño total máximo es **2 GiB**.

La exportación usa los archivos locales guardados. Guardá los cambios
pendientes del editor integrado antes de exportar. Una copia exportada es
independiente: las ediciones posteriores en Worcog no actualizan las copias ya
compartidas. Exportar archivos no es lo mismo que crear una copia completa del
espacio de trabajo y no incluye tareas, contactos ni un manifiesto del espacio.

## Editar documentos

**Ajustes → General → Abrir documentos en Worcog** habilita el editor integrado
opcional para DOCX, XLSX, PPTX y CSV. Los demás adjuntos, incluido PDF, se abren
con la aplicación predeterminada del sistema. Desactivar la opción recupera ese
comportamiento para nuevas aperturas; las ventanas ya abiertas siguen disponibles.

El editor se carga desde **edit.chaxus.com** y necesita internet para cargar.
La edición se procesa en el dispositivo. Esto es independiente de la base
local de Worcog y no agrega sincronización automática con la nube ni integración
con cuentas de Microsoft Office.

Los documentos se abren en un modal flotante grande. Sus controles permiten
minimizarlo o cerrarlo. Abrir y cerrar usa una transición breve de opacidad y
escala. Minimizar desplaza el visor hacia su punto en la barra flotante;
restaurar lo expande desde ese punto. El iframe permanece montado al minimizar,
conservando el documento y los cambios sin guardar.

Al abrir o restaurar, se muestra una pantalla del color del archivo con un
icono centrado de hoja de cálculo, Word o PowerPoint hasta que finalice la
animación de entrada y el editor haya abierto el archivo. También cubre las
transiciones de minimización y cierre. El iframe permanece montado debajo y
aparece directamente, sin otra transición de opacidad. El cambio lateral es
la excepción: el editor permanece visible durante todo el desplazamiento.

Hacer clic en el fondo oscuro también minimiza el visor. No se puede minimizar
mientras se guarda, se consultan cambios sin guardar o se responde la
confirmación de cierre. La barra de título principal permanece por encima del
fondo oscuro, por lo que podés arrastrar, minimizar, maximizar o cerrar Worcog
con un documento abierto. El espacio de trabajo queda inactivo hasta minimizar
o cerrar el documento. Podés abrir varios; los minimizados aparecen como puntos
individuales abajo a la derecha. Pasá el cursor por un punto para identificar
su documento y hacé clic para restaurarlo.

Con un visor abierto y al menos dos documentos, **Ctrl + flecha izquierda/derecha**
en Windows o **Command + Option + flecha izquierda/derecha** en macOS cambia de
documento en orden de apertura y vuelve al principio o al final al llegar a un
extremo. El cambio desliza el documento actual hacia un lado y trae el siguiente
desde el opuesto. Los editores cargados permanecen visibles y opacos durante la
transición, sin repetir la pantalla de carga, tomar capturas ni recargar documentos.

Las versiones de escritorio para Windows y macOS capturan los atajos configurados
también dentro del editor. En vistas previas del navegador y otros sistemas,
funcionan con el foco en los controles del visor de Worcog. Los atajos se pausan
al guardar o confirmar un cierre. Las transiciones respetan la preferencia de
movimiento reducido del sistema.

Al cerrar un documento que pueda tener cambios sin guardar, elegí **Guardar y
cerrar**, **Descartar** o **Cancelar**. Guardar actualiza el adjunto existente y
conserva sus referencias a tareas y temas; no crea otro adjunto por cada edición.
Si el editor no carga, su panel de error ofrece **Abrir con la aplicación
predeterminada**. Mantené el documento abierto y reintentá si falla el guardado.

## Contactos, responsables y solicitantes

**Contactos** gestiona un directorio compartido por los responsables de temas
y tareas y los solicitantes de temas. Los responsables existentes con solo
nombre aparecen allí automáticamente.

- Elegí **Nuevo contacto** para crearlo usando únicamente un nombre.
- Correo, Cargo y Área son opcionales. Agregalos o editalos desde
  **… → Editar contacto**.
- La búsqueda coincide con nombre, correo, cargo y área.
- Los selectores de responsables admiten uno o varios contactos. Solicitante
  admite uno por tema. Buscá un nombre o crealo dentro del selector y luego
  guardá la tarea o el tema.
- Renombrar un contacto actualiza también sus referencias como responsable y
  solicitante. Los nombres son únicos sin distinguir mayúsculas.
- Limpiar una selección solo quita esa asignación. La papelera del selector
  elimina el contacto después de la confirmación necesaria y de guardar el
  formulario. **Contactos → … → Eliminar contacto** también quita sus datos y
  referencias como responsable o solicitante tras confirmar, incluidos los
  temas archivados. Las tareas y los temas se conservan.

Son registros locales de contactos. Ingresar un correo no envía mensajes,
invita personas, concede acceso ni sincroniza una libreta externa.

## Historial y cronología del tema

**Historial** muestra los movimientos agrupados por fecha, del más reciente al
más antiguo, con las horas cerca de la línea de tiempo. Bajá para cargar
progresivamente entradas anteriores o usá **Cargar movimientos anteriores**.
La búsqueda y los filtros reducen el historial; hacer clic en una entrada abre
su tema, tarea o recurso.

El historial incluye registros de creación, actividades registradas y las
últimas fechas de actualización de las entidades admitidas. No es un registro
de auditoría inmutable de cada cambio de campo ni conserva registros eliminados.

Dentro de un tema, **Cronología** reúne la actividad de sus tareas, los cambios
de estado y los eventos de las fuentes asociadas. Se ordena del más reciente al
más antiguo; la fecha del evento de una fuente puede ser distinta de la fecha
en que se ingresó. Los avances también tienen su propio hilo plegable en cada
tarea. No existe un flujo separado para crear anotaciones.

## Archivo y eliminación permanente

Usá **Archivar** en un tema para quitarlo de las vistas activas sin eliminar sus
datos. **Archivo** en la barra lateral permite encontrar los archivados y
restaurarlos al trabajo activo.

La eliminación permanente es distinta. Leé los recuentos de elementos afectados
antes de confirmar. Eliminar una tarea puede eliminar descendientes, una serie
recurrente y actividad vinculada. Eliminar un tema puede quitar sus tareas y
los registros o archivos asociados exclusivamente a él; los recursos compartidos
conservan sus relaciones restantes cuando corresponde. Eliminar un archivo quita
la copia administrada del disco.

No hay papelera, historial de eliminación ni copia automática antes de una
eliminación común. Las copias y exportaciones anteriores no se modifican.
Restaurar una copia antigua puede recuperar registros eliminados después de ella.

## Ajustes, colores y apariencia

**Ajustes → General** contiene:

- **Idioma:** elegí English o Español. El valor inicial es inglés. La interfaz,
  los selectores compartidos y las fechas mostradas cambian de inmediato sin
  navegar ni recargar. Esta preferencia del dispositivo también se aplica a la
  ventana de recordatorios. No traduce nombres, descripciones, notas ni otros
  contenidos guardados. La guía también sigue el idioma seleccionado. El editor
  externo, los diálogos nativos y los diagnósticos técnicos conservan su propio
  idioma. La preferencia no se incluye en las copias del espacio de trabajo.
- **Apariencia:** tema Claro, Oscuro o Sistema. Sistema sigue al sistema operativo.
  La preferencia se guarda en el dispositivo.
- **Textura superpuesta:** activa o desactiva la textura. Opacidad ajusta su
  intensidad, con un valor inicial de 50%.
- **Abrir documentos en Worcog:** alterna entre el editor integrado y la apertura
  con la aplicación predeterminada del sistema.
- **Menús contextuales:** reemplaza los botones de tres puntos de las tareas por
  clic derecho y permite Editar, Archivar/Desarchivar y Eliminar en las filas de
  Temas y Archivo. Desactivado por defecto y guardado en este dispositivo.
- **Inactividad de los temas:** configurá un número positivo de días y los colores
  Inicial, Intermedio y Final. Hacé clic en los puntos del degradado horizontal
  para ajustar los colores y elegí **Guardar ajustes de inactividad**. El período
  inicial es de 14 días y la paleta va de blanco grisáceo, por un punto intermedio,
  a rojo. En **Pausar la inactividad los**, elegí los días de la semana que se
  excluyen, por ejemplo sábado y domingo. Los botones seleccionados indican los
  días excluidos; por defecto cuentan todos. Guardá para aplicar la selección a
  temas existentes y nuevos. Seleccionar los siete días pausa toda la inactividad.
  También afecta a la lista de temas inactivos del resumen, pero nunca a las
  fechas límite de tareas o temas.
- **Bandeja y recordatorios:** activa la bandeja y las notificaciones de Worcog,
  permite configurar sonido y volumen, probarlos y gestionar alertas pendientes.
  Ambas funciones opcionales empiezan desactivadas. Las opciones de apariencia,
  editor de documentos y bandeja/recordatorios usan interruptores accesibles.

Los indicadores de fecha límite usan estos mismos colores, pero calculan el
progreso con sus propias fechas iniciales o de creación y objetivo. Los temas
sin fecha objetivo usan el período de inactividad. Las preferencias del
dispositivo, incluidos colores y textura, son independientes de las copias del
espacio de trabajo.

**Ajustes → Almacenamiento y copias de seguridad** contiene copias, exportación,
restauración, ubicaciones, limpieza de archivos y eliminación completa.
**Ajustes → Actualizaciones** contiene los controles de actualización.

## Copias de seguridad, exportación y restauración

Usá **Ajustes → Almacenamiento y copias de seguridad**:

- **Crear copia de seguridad:** genera una copia local en el directorio de
  copias de Worcog.
- **Exportar archivo ZIP…:** genera un ZIP completo del espacio de trabajo en
  el destino elegido. Conservá una copia en otro dispositivo para protegerte
  ante una falla del disco.
- **Importar / restaurar…:** elegí un ZIP de Worcog, revisá el resumen y confirmá.
  Worcog lo valida y crea una copia de seguridad antes del reemplazo.
- **Mostrar ubicaciones:** muestra las rutas de datos, adjuntos, copias y caché
  de esta instalación.
- **Reintentar limpieza de archivos:** vuelve a intentar las eliminaciones
  pendientes, por ejemplo después de que otra aplicación libere un archivo.
- **Eliminar todos los datos:** borra permanentemente registros y archivos
  administrados. La confirmación permite incluir las copias locales. Las
  exportaciones externas, documentos originales y preferencias del dispositivo
  permanecen separados.

Los archivos completos incluyen temas, tareas, actividades, fuentes, adjuntos,
contactos y asignaciones. Restaurar **reemplaza** el espacio de trabajo: no
combina dos espacios. Un ZIP generado con Exportar adjuntos contiene solo
archivos y no sirve para restaurar el espacio completo. Los horarios y descartes
de recordatorios viajan con el espacio; las preferencias de bandeja,
notificaciones y audio personalizado no.

La inspección de archivos, las copias, la exportación y la restauración se
ejecutan en segundo plano. Las operaciones de almacenamiento pueden esperar a
que termine una copia o restauración para mantener consistentes los registros
y archivos; la ventana de la aplicación permanece disponible.

Los archivos ZIP no están cifrados. Los adjuntos faltantes o modificados pueden
impedir una copia o exportación completas; resolvé los archivos informados
antes de reintentar. Al volver a comprimir, no agregues una carpeta contenedora:
`workspace.json` y `attachments/` deben estar directamente en la raíz del ZIP.
Se acepta la entrada vacía `attachments/` que generan las herramientas de
compresión habituales; se rechazan archivos duplicados, carpetas inesperadas
y enlaces simbólicos. No muevas manualmente una base SQLite activa. Usá los
controles de copia, exportación y restauración para trasladar datos.

## Actualizaciones de la aplicación

En Windows x64 y macOS, tanto Intel como Apple Silicon, Worcog consulta GitHub
Releases al iniciar. Usá **Ajustes → Actualizaciones → Buscar actualizaciones**
para una consulta manual. Una versión disponible ofrece notas y **Descargar
actualización**.

Hacé clic en la notificación para abrir sus detalles en un modal sobre la vista
actual, sin recargar el espacio de trabajo. La notificación sigue el tema de
la aplicación.

Worcog elige el archivo correspondiente al sistema: un `.exe` portable en
Windows o `worcog-v<version>-macos-universal.zip` con `Worcog.app` en macOS.
Espera a que termine la compilación de esa plataforma; el archivo de otra
plataforma no dispara una actualización. Las rutas de Windows omiten el prefijo
interno de ruta extendida.

La descarga se verifica y se guarda separada de los datos del espacio. La
instalación es manual: Worcog no se cierra, reemplaza la aplicación en ejecución
ni inicia automáticamente la actualización. En macOS, cerrá Worcog, extraé el
ZIP y reemplazá la `Worcog.app` anterior. La compilación tiene firma ad hoc, sin
notarización de Apple; Gatekeeper puede pedir autorización en el primer inicio
desde **Ajustes del Sistema → Privacidad y seguridad**.

Podés configurar una credencial de GitHub para versiones privadas; ingresarla
no cambia el almacenamiento del espacio de trabajo. Los problemas de conexión
o acceso de una consulta manual se informan en la interfaz.

Usá **Ajustes → Actualizaciones → Acceso a repositorios privados** para guardar,
reemplazar o eliminar un token de GitHub. Las versiones de producción para
Windows usan el Administrador de credenciales y las de macOS, el Llavero. El
secreto guardado nunca vuelve al formulario ni se incluye en las copias del
espacio. Desarrollo conserva un token separado y sin cifrar en su perfil del
navegador y nunca accede a las credenciales de producción.

## Atajos de teclado y navegación

Estos atajos se aplican en la interfaz de Worcog. Los editores integrados pueden
manejar sus propios atajos mientras el iframe tiene el foco.

**Ajustes → General → Atajos de teclado** permite editar perfiles separados
para Windows y macOS. Hacé clic en el campo del atajo, marcado con un lápiz y
**Hacé clic para cambiar**: se resalta, muestra **Presioná una combinación…**
y **Esperando…**, y previsualiza los modificadores presionados. Presioná la
nueva combinación para guardarla de inmediato en este dispositivo; una
confirmación muestra el atajo guardado. Escape conserva la combinación anterior.
Supr/Retroceso desactiva la acción y Restaurar valores predeterminados restablece
solo el perfil elegido. Se rechazan combinaciones duplicadas entre acciones.
El sistema operativo activa su perfil automáticamente; Linux y las vistas de
navegador usan el de Windows. El modificador de selección para exportar tiene
su propio selector. Los atajos reservados del sistema pueden tener prioridad.
La tabla muestra los valores iniciales; tus combinaciones configuradas los
reemplazan. Tab, Escape, Enter, la navegación por menús y el arrastre mantienen
su funcionamiento habitual.

| Atajo / gesto | Dónde | Acción |
| --- | --- | --- |
| Ctrl + clic (Windows) / Command + clic (macOS) | Adjuntos en tarjetas de tareas | Seleccionar o deseleccionar un archivo para exportar sin abrirlo; el modificador se puede configurar |
| Ctrl / Command + Enter o Espacio | Adjunto enfocado en una tarjeta | Alternar su selección para exportar con el modificador configurado |
| Alt / Option + T | Notificaciones de Worcog | Enfocar el área de notificaciones; configurable |
| Shift + F10 / tecla Menú | Tarjeta de tarea, fila de tema o sus controles enfocados, con Menús contextuales activado | Abrir el menú de acciones; la combinación es configurable y la tecla Menú permanece disponible |
| Espacio / Enter | Control de arrastre de una tarea enfocado | Iniciar el arrastre o soltar en el destino resaltado |
| Flechas | Durante el arrastre de una tarea con teclado | Moverse hacia un destino de jerarquía o una línea de inserción de Libre |
| Escape | Durante el arrastre de una tarea | Cancelar el movimiento sin guardar cambios |
| Enter / Espacio | Tarea o tema de destino enfocado en el modo Vincular | Guardar una conexión con ese elemento |
| Escape | Modo Vincular | Cancelar la selección del destino |
| Ctrl + flecha izquierda/derecha (Windows) | Visor abierto con varios documentos, también dentro del editor | Deslizar al documento anterior o siguiente, volviendo al otro extremo al llegar al final; configurable |
| Command + Option + flecha izquierda/derecha (macOS) | Visor abierto con varios documentos, también dentro del editor | Misma navegación entre documentos, configurable independientemente de Windows |
| Tab / Shift + Tab | Controles de Worcog | Avanzar o retroceder el foco |
| Enter / Espacio | Botones y casillas enfocados | Activar el control o alternar la casilla |
| Espacio | Interruptor de ajustes enfocado | Cambiar el ajuste |
| Flechas y Enter | Menús y selectores con búsqueda abiertos | Recorrer opciones y elegir una |
| Flecha izquierda/derecha | Listas de pestañas enfocadas | Cambiar de pestaña |
| Escape | Diálogos, menús y desplegables habituales | Solicitar el cierre; una operación pendiente puede impedirlo |

Pasar el cursor abre el menú **…** de una tarea; también puede abrirse con clic
o teclado. Pasar el cursor o enfocar muestra descripciones, motivos de bloqueo
y ayudas de los puntos de documentos. Cerrar un documento puede preguntar qué
hacer con cambios sin guardar. Un clic normal sigue abriendo el archivo; para
seleccionarlo para exportar hace falta el modificador.

Solo los atajos de navegación entre documentos se registran de forma nativa
para funcionar dentro del editor en Windows/macOS. Los demás atajos se aplican
en la interfaz de Worcog. Los ajustes y perfiles son preferencias del
dispositivo y no forman parte de las exportaciones del espacio de trabajo.
Las alertas de recordatorios requieren descartarlas expresamente con **×**;
Escape y Alt+F4 no descartan la cola pendiente.

## Almacenamiento, privacidad y solución de problemas

Worcog guarda su base SQLite y archivos administrados en el directorio de datos
persistentes del sistema operativo. La caché contiene datos regenerables, como
actualizaciones descargadas. La barra lateral informa si el almacenamiento está
disponible o si hay una operación en curso.

El espacio de trabajo prioriza el almacenamiento local. Ingresar una fuente no
conecta con su servicio de correo, tickets o mensajería ni importa información
automáticamente. No hay sincronización del espacio con la nube ni telemetría.
El editor opcional carga un sitio externo y las actualizaciones consultan
GitHub. Worcog no cifra la base de datos, los documentos adjuntos ni las
exportaciones.

### Situaciones comunes

- **Requiere la aplicación de escritorio:** abrí la aplicación; una vista previa
  del navegador no puede acceder a la base nativa, los diálogos de archivos ni
  los comandos de exportación.
- **No se pudo abrir la base de datos:** revisá la ubicación y los permisos
  informados y usá Volver a intentar. No elimines la base para quitar un error.
- **Archivo no encontrado / inaccesible:** la copia administrada falta, cambió
  o no se puede leer. Las demás tareas y temas siguen siendo editables. Si hace
  falta, adjuntá una copia válida desde la tarea o tema correspondiente.
- **Un borrador de recurso impide guardar:** agregá el recurso a la tarea o
  descartá expresamente su borrador y volvé a guardar la tarea.
- **Exportación cancelada:** la selección se conserva para reintentar. Elegí
  un nombre de destino nuevo si ya existe uno igual.
- **Los cambios del documento no aparecen al exportar:** guardalos primero en
  el editor integrado. Exportar lee el adjunto guardado, no los cambios sin
  guardar del iframe.
- **Limpieza de archivos pendiente:** cerrá las aplicaciones que usen el archivo
  y elegí Ajustes → Almacenamiento y copias de seguridad → Reintentar limpieza
  de archivos.
- **No se ofrece una actualización:** la versión debe ser más nueva y tener
  un archivo compatible, completamente cargado, para tu sistema operativo. Una
  versión puede aparecer antes de terminar su compilación; consultá de nuevo
  cuando haya terminado.
- **No se puede activar un recordatorio:** habilitá primero Icono en la bandeja
  y Notificaciones de recordatorios en Ajustes → General. La programación
  existente permanece pausada al desactivar estas funciones.
- **El recordatorio se ve, pero no suena:** revisá el volumen de Worcog, el
  silencio y salida del sistema y el error de sonido informado. Si falta el
  archivo personalizado, se usa el tono predeterminado; los dispositivos no
  disponibles se reintentan. Siempre podés descartar la alerta visual.
- **Worcog desapareció después de cerrar:** con Icono en la bandeja activado,
  cerrar oculta la ventana. Restaurala desde la bandeja y usá Exit para salir
  por completo.

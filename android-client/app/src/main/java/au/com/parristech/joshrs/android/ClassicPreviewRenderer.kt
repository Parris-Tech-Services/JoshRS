package au.com.parristech.joshrs.android

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PointF
import android.graphics.RectF
import kotlin.math.abs
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

/**
 * Original, software-drawn *visual study* of a classic low-poly RPG layout.
 *
 * It is NOT a revision-377 renderer, does not decode Jagex game cache,
 * and has no networking, login, inventory, NPC AI or save access.
 * The main game engine and the existing Java client remain untouched.
 */
class ClassicPreviewRenderer {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val stone = Color.rgb(64, 64, 58)
    private val sandstone = Color.rgb(188, 175, 144)
    private val parchment = Color.rgb(216, 201, 165)
    private val gold = Color.rgb(236, 202, 118)

    data class Camera(
        val width: Float, val height: Float, val scale: Float,
        val cx: Float, val cy: Float, val tileX: Float, val tileY: Float,
        val sceneBottom: Float
    )

    fun camera(width: Int, height: Int): Camera {
        val w = width.toFloat()
        val h = height.toFloat()
        val s = min(w / 393f, h / 760f).coerceIn(.65f, 2.8f)
        val bottom = h * .73f
        return Camera(w, h, s, w / 2f, bottom * .48f, 22f * s, 11f * s, bottom)
    }

    fun worldAt(x: Float, y: Float, player: PreviewSnapshot, width: Int, height: Int): Pair<Float, Float>? {
        val c = camera(width, height)
        if (y < 34 * c.scale || y >= c.sceneBottom) return null
        val a = (x - c.cx) / c.tileX
        val b = (y - c.cy) / c.tileY
        return (player.x + (a + b) / 2f) to (player.y + (b - a) / 2f)
    }

    fun tabAt(x: Float, y: Float, width: Int, height: Int): Int? {
        val c = camera(width, height)
        val top = c.sceneBottom + 74f * c.scale
        val bottom = top + 35f * c.scale
        if (y !in top..bottom || x !in 0f..c.width) return null
        return ((x / c.width) * 4).toInt().coerceIn(0, 3)
    }

    fun padDirection(x: Float, y: Float, width: Int, height: Int): Int? {
        val c = camera(width, height)
        val cx = 57f * c.scale
        val cy = c.sceneBottom - 79f * c.scale
        val size = 34f * c.scale
        val r = 18f * c.scale
        val points = arrayOf(
            cx to (cy - size), cx to (cy + size),
            (cx - size) to cy, (cx + size) to cy
        )
        return points.indexOfFirst { (px, py) ->
            abs(x - px) <= r && abs(y - py) <= r
        }.takeIf { it >= 0 }
    }

    private fun project(x: Float, y: Float, player: PreviewSnapshot, c: Camera, z: Float = 0f): PointF {
        val dx = x - player.x
        val dy = y - player.y
        return PointF(c.cx + (dx - dy) * c.tileX,
            c.cy + (dx + dy) * c.tileY - z * c.scale)
    }

    private fun polygon(canvas: Canvas, color: Int, vararg points: PointF) {
        if (points.size < 3) return
        paint.style = Paint.Style.FILL
        paint.color = color
        val path = Path()
        path.moveTo(points[0].x, points[0].y)
        for (i in 1 until points.size) path.lineTo(points[i].x, points[i].y)
        path.close()
        canvas.drawPath(path, paint)
    }

    private fun text(canvas: Canvas, value: String, x: Float, y: Float, size: Float, color: Int,
        bold: Boolean = false, centered: Boolean = false) {
        paint.style = Paint.Style.FILL
        paint.color = color
        paint.typeface = if (bold) android.graphics.Typeface.DEFAULT_BOLD else android.graphics.Typeface.DEFAULT
        paint.textAlign = if (centered) Paint.Align.CENTER else Paint.Align.LEFT
        paint.textSize = size
        canvas.drawText(value, x, y, paint)
        paint.textAlign = Paint.Align.LEFT
    }

    private fun groundColor(x: Int, y: Int): Int {
        return when {
            (x in 1..4 && y in 10..13) -> if ((x + y) % 2 == 0) Color.rgb(67, 119, 132) else Color.rgb(54, 99, 115)
            (abs(x - 8) <= 1 && y in 3..22) || (abs(y - 8) <= 1 && x in 2..20) ->
                if ((x + y) % 2 == 0) Color.rgb(160, 148, 113) else Color.rgb(150, 138, 103)
            ((x * 19 + y * 11) % 9 < 3) -> Color.rgb(89, 135, 73)
            (x + y) % 3 == 0 -> Color.rgb(76, 118, 66)
            else -> Color.rgb(83, 127, 71)
        }
    }

    private fun drawGroundTile(canvas: Canvas, x: Int, y: Int, player: PreviewSnapshot, c: Camera) {
        val p1 = project(x.toFloat(), y.toFloat(), player, c)
        val p2 = project(x + 1f, y.toFloat(), player, c)
        val p3 = project(x + 1f, y + 1f, player, c)
        val p4 = project(x.toFloat(), y + 1f, player, c)
        if ((p1.x < -100 * c.scale && p2.x < -100 * c.scale) ||
            (p3.x > c.width + 100 * c.scale && p4.x > c.width + 100 * c.scale)) return
        polygon(canvas, groundColor(x, y), p1, p2, p3, p4)
        // Alternating low-poly highlights replace the flat green chequerboard.
        if ((x * 7 + y * 13) % 5 == 0) {
            polygon(canvas, Color.argb(30, 224, 220, 152), p1, p2, p3)
        }
        if ((x * 17 + y * 5) % 13 == 0) {
            val center = project(x + .5f, y + .5f, player, c)
            paint.color = Color.rgb(128, 146, 77)
            canvas.drawCircle(center.x, center.y, 1.8f * c.scale, paint)
        }
    }

    private fun tree(canvas: Canvas, x: Float, y: Float, player: PreviewSnapshot, c: Camera) {
        val p = project(x, y, player, c)
        if (p.x !in (-70f * c.scale)..(c.width + 70f * c.scale) ||
            p.y !in (-90f * c.scale)..(c.sceneBottom + 80f * c.scale)) return
        val s = c.scale
        // Shadow, brown timber trunk, two faceted conifer canopy sections.
        paint.color = Color.argb(100, 25, 47, 24)
        canvas.drawOval(RectF(p.x - 13*s, p.y - 4*s, p.x + 14*s, p.y + 6*s), paint)
        polygon(canvas, Color.rgb(105, 71, 42),
            PointF(p.x - 3*s, p.y - 4*s), PointF(p.x + 3*s, p.y - 4*s),
            PointF(p.x + 3*s, p.y - 34*s), PointF(p.x - 3*s, p.y - 34*s))
        for (level in 0..1) {
            val top = p.y - (66 - level * 22)*s
            val base = p.y - (23 - level * 10)*s
            val radius = (15 + level*7)*s
            polygon(canvas, Color.rgb(36, 81, 45),
                PointF(p.x, top), PointF(p.x - radius, base),
                PointF(p.x, base + 3*s))
            polygon(canvas, Color.rgb(57, 117, 58),
                PointF(p.x, top), PointF(p.x + radius, base),
                PointF(p.x, base + 3*s))
        }
    }

    private fun house(canvas: Canvas, x: Float, y: Float, player: PreviewSnapshot, c: Camera) {
        val s = c.scale
        val a = project(x, y, player, c)
        if (a.x < -190*s || a.x > c.width + 190*s ||
            a.y < -140*s || a.y > c.sceneBottom + 140*s) return
        val b = project(x + 3f, y, player, c)
        val d = project(x, y + 3f, player, c)
        val e = project(x + 3f, y + 3f, player, c)
        val height = 48*s
        polygon(canvas, Color.rgb(188, 169, 127),
            a, b, PointF(b.x, b.y-height), PointF(a.x, a.y-height))
        polygon(canvas, Color.rgb(155, 137, 102),
            a, d, PointF(d.x, d.y-height), PointF(a.x, a.y-height))
        polygon(canvas, Color.rgb(119, 100, 75),
            b, e, PointF(e.x, e.y-height), PointF(b.x, b.y-height))
        polygon(canvas, Color.rgb(98, 105, 117),
            PointF(a.x, a.y-height), PointF(b.x, b.y-height),
            PointF(b.x-8*s, b.y-height-39*s), PointF(a.x-8*s, a.y-height-39*s))
        polygon(canvas, Color.rgb(74, 82, 99),
            PointF(a.x, a.y-height), PointF(d.x, d.y-height),
            PointF(d.x-8*s, d.y-height-39*s), PointF(a.x-8*s, a.y-height-39*s))
        polygon(canvas, Color.rgb(122, 91, 68),
            PointF(d.x-8*s, d.y-height-39*s), PointF(e.x-8*s, e.y-height-39*s),
            PointF(e.x, e.y-height), PointF(d.x, d.y-height))
        val door = project(x + .35f, y + 2.7f, player, c)
        paint.color = Color.rgb(83, 57, 37)
        canvas.drawRect(door.x-6*s, door.y-28*s, door.x+7*s, door.y, paint)
        paint.color = gold
        canvas.drawCircle(door.x + 3*s, door.y-14*s, 1.5f*s, paint)
    }

    private fun rock(canvas: Canvas, x: Float, y: Float, player: PreviewSnapshot, c: Camera) {
        val p = project(x, y, player, c)
        val s=c.scale
        polygon(canvas, Color.rgb(91, 96, 98),
            PointF(p.x-15*s,p.y),PointF(p.x-12*s,p.y-16*s),
            PointF(p.x+3*s,p.y-24*s),PointF(p.x+18*s,p.y-9*s),PointF(p.x+14*s,p.y+4*s))
        polygon(canvas, Color.rgb(155, 157, 148),
            PointF(p.x-12*s,p.y-16*s),PointF(p.x+3*s,p.y-24*s),
            PointF(p.x+10*s,p.y-12*s),PointF(p.x-2*s,p.y-8*s))
    }

    private fun person(canvas: Canvas, x: Float, y: Float, player: PreviewSnapshot, c: Camera, npc: Boolean) {
        val p = project(x, y, player, c)
        val s=c.scale
        paint.color = Color.argb(115,20,27,18)
        canvas.drawOval(RectF(p.x-12*s,p.y-4*s,p.x+12*s,p.y+4*s),paint)
        val tunic = if (npc) Color.rgb(150, 81, 41) else Color.rgb(51, 88, 149)
        val trousers = Color.rgb(59, 54, 55)
        polygon(canvas,trousers,
            PointF(p.x-9*s,p.y),PointF(p.x+9*s,p.y),
            PointF(p.x+7*s,p.y-19*s),PointF(p.x-7*s,p.y-19*s))
        polygon(canvas,tunic,
            PointF(p.x-11*s,p.y-22*s),PointF(p.x+11*s,p.y-22*s),
            PointF(p.x+7*s,p.y-40*s),PointF(p.x-7*s,p.y-40*s))
        paint.color = Color.rgb(228, 184, 126)
        canvas.drawCircle(p.x,p.y-48*s,8*s,paint)
        paint.color = Color.rgb(77, 48, 34)
        canvas.drawArc(RectF(p.x-8*s,p.y-57*s,p.x+8*s,p.y-42*s),180f,180f,true,paint)
        if (npc) text(canvas,"Guide",p.x,p.y-66*s,10*s,gold,true,true)
    }

    private fun drawScene(canvas: Canvas, player: PreviewSnapshot, c: Camera) {
        val save = canvas.save()
        canvas.clipRect(0f,0f,c.width,c.sceneBottom)
        canvas.drawColor(Color.rgb(129, 151, 155))
        paint.color = Color.rgb(149, 166, 160)
        canvas.drawRect(0f,c.sceneBottom*.35f,c.width,c.sceneBottom,paint)
        val radius=15
        val xmin=max(0,floor(player.x).toInt()-radius)
        val xmax=min(46,floor(player.x).toInt()+radius)
        val ymin=max(0,floor(player.y).toInt()-radius)
        val ymax=min(46,floor(player.y).toInt()+radius)
        // Paint all ground before upright objects, otherwise ground tiles
        // drawn later can incorrectly cover trees, roofs and characters.
        for(sum in (xmin+ymin)..(xmax+ymax)) {
            for(x in xmin..xmax) {
                val y=sum-x
                if(y in ymin..ymax) drawGroundTile(canvas,x,y,player,c)
            }
        }
        // Then paint upright scene objects in diagonal depth order.
        for(sum in (xmin+ymin)..(xmax+ymax)) {
            for(x in xmin..xmax) {
                val y=sum-x
                if(y !in ymin..ymax) continue
                when(x to y) {
                    10 to 7, 4 to 14 -> house(canvas,x.toFloat(),y.toFloat(),player,c)
                    3 to 7, 5 to 5, 12 to 10, 15 to 6, 6 to 16, 17 to 13, 2 to 15 ->
                        tree(canvas,x.toFloat()+.5f,y.toFloat()+.5f,player,c)
                    7 to 11, 14 to 8 -> rock(canvas,x.toFloat()+.4f,y.toFloat()+.5f,player,c)
                    9 to 10 -> person(canvas,x+.5f,y+.5f,player,c,true)
                }
                if(floor(player.x).toInt()==x && floor(player.y).toInt()==y) {
                    person(canvas,player.x,player.y,player,c,false)
                }
            }
        }
        if (player.targetX != null && player.targetY != null) {
            val p=project(player.targetX,player.targetY,player,c)
            paint.color=gold
            paint.style=Paint.Style.STROKE
            paint.strokeWidth=2.4f*c.scale
            canvas.drawOval(RectF(p.x-10*c.scale,p.y-5*c.scale,
                p.x+10*c.scale,p.y+5*c.scale),paint)
            paint.style=Paint.Style.FILL
        }
        // Clearly indicate that this is not connected to a RuneScape server.
        paint.color = Color.argb(200,27,30,30)
        canvas.drawRoundRect(8*c.scale,7*c.scale,238*c.scale,32*c.scale,
            6*c.scale,6*c.scale,paint)
        text(canvas,"OFFLINE VISUAL PROTOTYPE",15*c.scale,25*c.scale,
            12*c.scale,Color.WHITE,true)
        drawCompass(canvas,c)
        drawPad(canvas,c)
        canvas.restoreToCount(save)
    }

    private fun drawCompass(canvas: Canvas,c:Camera) {
        val x=c.width-47*c.scale
        val y=58*c.scale
        paint.style=Paint.Style.FILL
        paint.color=Color.rgb(46,43,37)
        canvas.drawCircle(x,y,40*c.scale,paint)
        paint.color=Color.rgb(158,158,131)
        canvas.drawCircle(x,y,35*c.scale,paint)
        paint.color=Color.rgb(71,102,61)
        canvas.drawCircle(x,y,31*c.scale,paint)
        for(i in 0..6) for(j in 0..6) {
            paint.color=if((i+j)%2==0) Color.rgb(93,126,77) else Color.rgb(105,137,81)
            val px=x+(i-3)*8*c.scale
            val py=y+(j-3)*8*c.scale
            if ((px-x)*(px-x)+(py-y)*(py-y)<28*28*c.scale*c.scale)
                canvas.drawRect(px-3*c.scale,py-3*c.scale,px+3*c.scale,py+3*c.scale,paint)
        }
        paint.color=Color.WHITE
        canvas.drawCircle(x,y,3*c.scale,paint)
        text(canvas,"N",x,y-42*c.scale,11*c.scale,gold,true,true)
    }

    private fun drawPad(canvas: Canvas,c:Camera) {
        val cx=57*c.scale
        val cy=c.sceneBottom-79*c.scale
        val step=34*c.scale
        val offsets=arrayOf(0f to -step,0f to step,-step to 0f,step to 0f)
        val names=arrayOf("↑","↓","←","→")
        for(i in offsets.indices) {
            val x=cx+offsets[i].first
            val y=cy+offsets[i].second
            paint.color=Color.argb(220,57,51,45)
            canvas.drawRoundRect(x-17*c.scale,y-17*c.scale,x+17*c.scale,y+17*c.scale,
                6*c.scale,6*c.scale,paint)
            text(canvas,names[i],x,y+6*c.scale,21*c.scale,parchment,true,true)
        }
        paint.color=Color.argb(185,40,36,33)
        canvas.drawRoundRect(c.width-112*c.scale,c.sceneBottom-40*c.scale,
            c.width-8*c.scale,c.sceneBottom-12*c.scale,6*c.scale,6*c.scale,paint)
        text(canvas,"TAP TO WALK",c.width-60*c.scale,c.sceneBottom-21*c.scale,
            10*c.scale,Color.WHITE,true,true)
    }

    private fun panel(canvas: Canvas, c: Camera, tab: Int, player:PreviewSnapshot) {
        val s=c.scale
        val top=c.sceneBottom
        paint.color=Color.rgb(50,48,42)
        canvas.drawRect(0f,top,c.width,c.height,paint)
        paint.color=Color.rgb(102,91,74)
        canvas.drawRect(0f,top,c.width,top+5*s,paint)
        paint.color=Color.rgb(197,181,144)
        canvas.drawRect(7*s,top+11*s,c.width-7*s,top+68*s,paint)
        paint.color=Color.rgb(79,72,62)
        canvas.drawRoundRect(12*s,top+16*s,c.width-12*s,top+64*s,4*s,4*s,paint)
        text(canvas,"All   Game   Public   Private",19*s,top+33*s,11*s,gold,true)
        text(canvas,"System: Offline preview — no real world loaded.",19*s,top+53*s,
            11*s,Color.rgb(237,227,202))

        val names=arrayOf("Inventory","Skills","Quests","Map")
        val labels=arrayOf("BAG","STATS","QUESTS","MAP")
        val tabY=top+74*s
        val tabHeight=35*s
        val tabWidth=c.width/4
        for(i in 0..3) {
            paint.color=if(i==tab) Color.rgb(133,110,75) else Color.rgb(75,69,61)
            canvas.drawRoundRect(i*tabWidth+2*s,tabY,(i+1)*tabWidth-2*s,tabY+tabHeight,
                5*s,5*s,paint)
            text(canvas,labels[i],(i+.5f)*tabWidth,tabY+23*s,12*s,
                if(i==tab) Color.WHITE else parchment,true,true)
        }
        val contentTop=tabY+42*s
        paint.color=Color.rgb(75,67,54)
        canvas.drawRect(7*s,contentTop,c.width-7*s,c.height-5*s,paint)
        text(canvas,names[tab],16*s,contentTop+19*s,14*s,gold,true)
        when(tab) {
            0 -> {
                val cols=4
                val slots=2
                val startX=15*s
                val startY=contentTop+26*s
                val size=min(41*s,(c.height-startY-9*s)/slots-4*s)
                for(r in 0 until slots) for(col in 0 until cols) {
                    val x=startX+col*(size+5*s)
                    val y=startY+r*(size+5*s)
                    paint.color=Color.rgb(49,44,37)
                    canvas.drawRect(x,y,x+size,y+size,paint)
                    paint.color=Color.rgb(116,104,84)
                    paint.style=Paint.Style.STROKE
                    paint.strokeWidth=1.2f*s
                    canvas.drawRect(x,y,x+size,y+size,paint)
                    paint.style=Paint.Style.FILL
                }
                text(canvas,"Preview slots only",225*s,contentTop+42*s,11*s,parchment)
                text(canvas,"No real inventory",225*s,contentTop+62*s,11*s,parchment)
            }
            1 -> {
                text(canvas,"Combat:  —",17*s,contentTop+44*s,12*s,parchment)
                text(canvas,"Skills require live 377 state.",17*s,contentTop+68*s,12*s,parchment)
            }
            2 -> {
                text(canvas,"No quests loaded in this preview.",17*s,contentTop+49*s,12*s,parchment)
            }
            else -> {
                text(canvas,"Local X: %.1f   Y: %.1f".format(player.x,player.y),
                    17*s,contentTop+45*s,12*s,parchment)
                text(canvas,"Not your real Gielinor map.",17*s,contentTop+67*s,12*s,parchment)
            }
        }
    }

    fun render(canvas: Canvas, player: PreviewSnapshot, selectedTab: Int) {
        val c=camera(canvas.width,canvas.height)
        canvas.drawColor(stone)
        drawScene(canvas,player,c)
        panel(canvas,c,selectedTab.coerceIn(0,3),player)
    }
}

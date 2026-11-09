package au.com.parristech.joshrs.android

import java.util.ArrayDeque
import java.util.zip.CRC32
import kotlin.math.abs

/**
 * A genuinely interactive, offline *reconstruction* with original art.
 * The Cook quest ingredients/rewards follow RuneScape 377, but map graphics
 * and collision are not the historic Jagex cache. No native .sav is touched.
 */
class OfflineLumbridgeQuest private constructor() {
    data class Place(val id: String, val name: String, val x: Int, val z: Int)
    data class Result(val success: Boolean, val message: String)
    companion object {
        const val MIN_X=3152; const val MAX_X=3270
        const val MIN_Z=3200; const val MAX_Z=3320
        const val START_X=3211; const val START_Z=3218
        private const val WIDTH=MAX_X-MIN_X+1
        private const val FORMAT="JOSHRS_OFFLINE_COOK_V1"
        private val ITEMS=listOf("Pot","Bucket","Egg","Bucket of milk","Grain","Pot of flour")
        val places=listOf(
            Place("cook","Cook at Lumbridge Castle",3209,3214),
            Place("supplies","Kitchen pot and bucket",3211,3213),
            Place("egg","Chicken farm",3231,3295),
            Place("cow","Dairy cow",3253,3270),
            Place("wheat","Wheat field",3165,3298),
            Place("mill","Windmill",3165,3306))
        fun fresh()=OfflineLumbridgeQuest()
        fun restore(encoded:String?):OfflineLumbridgeQuest {
            if(encoded==null||encoded.length>512)return fresh()
            return try {
                val a=encoded.split("|")
                require(a.size==15 && a[0]==FORMAT)
                val payload=a.dropLast(1).joinToString("|")
                val crc=CRC32().apply{update(payload.toByteArray())}.value
                require(crc==a.last().toLong())
                val n=a.subList(1,14).map{it.toInt()}
                val w=fresh()
                require(w.walkable(n[0],n[1]) && n[2] in 0..2 &&
                    n[3] in 0..1000000 && n[4] in 0..1)
                require(n.subList(5,11).all{it in 0..1} &&
                    n[11] in 0..3 && n[12] in 0..5000000)
                require((n[2]==2)==(n[3]>=300 && n[4]==1))
                w.x=n[0];w.z=n[1];w.stage=n[2]
                w.cookingXp=n[3];w.questPoints=n[4]
                for(i in ITEMS.indices)w.items[ITEMS[i]]=n[i+5]
                w.hopperStep=n[11];w.walkedTiles=n[12]
                w.lastMessage="Your offline progress was restored."
                w
            }catch(_:Exception){fresh()}
        }
    }

    var x=START_X
        private set
    var z=START_Z
        private set
    var stage=0
        private set
    var cookingXp=0
        private set
    var questPoints=0
        private set
    var hopperStep=0
        private set
    var walkedTiles=0
        private set
    var lastMessage="Speak to the Cook in Lumbridge Castle to begin."; private set
    private val items=linkedMapOf<String,Int>().apply{ITEMS.forEach{put(it,0)}}
    private val route=ArrayDeque<Pair<Int,Int>>()
    private var stepTime=0f

    fun inventory()=items.filterValues{it>0}.keys.toList()
    fun has(name:String)=(items[name]?:0)>0
    fun distance(tx:Int,tz:Int)=maxOf(abs(x-tx),abs(z-tz))
    fun nearby()=places.filter{distance(it.x,it.z)<=2}
    fun target():Pair<Int,Int>?=route.peekLast()
    fun moving()=route.isNotEmpty()
    fun walkable(tx:Int,tz:Int)=tx in MIN_X..MAX_X && tz in MIN_Z..MAX_Z &&
        (tx !in 3239..3241 || tz in 3248..3253 || tz in 3287..3291)
    private fun index(tx:Int,tz:Int)=(tz-MIN_Z)*WIDTH+tx-MIN_X
    private fun tile(i:Int)=(MIN_X+i%WIDTH) to (MIN_Z+i/WIDTH)
    private fun result(ok:Boolean,msg:String):Result{lastMessage=msg;return Result(ok,msg)}

    /** Four-way BFS; crossing the river requires a bridge, never teleportation. */
    fun walkTo(tx:Int,tz:Int):Result {
        if(!walkable(tx,tz))return result(false,"That tile cannot be reached.")
        route.clear()
        if(tx==x && tz==z)return result(true,"Already here.")
        val prev=IntArray(WIDTH*(MAX_Z-MIN_Z+1)){-1}
        val queue=IntArray(prev.size)
        var start=0;var end=0
        val origin=index(x,z);val goal=index(tx,tz)
        queue[end++]=origin;prev[origin]=origin
        val directions=arrayOf(1 to 0,0 to 1,-1 to 0,0 to -1)
        while(start<end && prev[goal]==-1){
            val here=queue[start++];val (px,pz)=tile(here)
            for((dx,dz) in directions){
                val nx=px+dx;val nz=pz+dz
                if(!walkable(nx,nz))continue
                val next=index(nx,nz)
                if(prev[next]!=-1)continue
                prev[next]=here;queue[end++]=next
                if(next==goal)break
            }
        }
        if(prev[goal]==-1)return result(false,"No safe path available.")
        val backward=mutableListOf<Pair<Int,Int>>()
        var at=goal
        while(at!=origin){backward.add(tile(at));at=prev[at]}
        for(i in backward.indices.reversed())route.addLast(backward[i])
        stepTime=0f
        return result(true,"Walking to "+tx+","+tz+".")
    }
    fun walkTo(placeId:String):Result {
        val p=places.find{it.id==placeId}?:return result(false,"Unknown destination.")
        return walkTo(p.x,p.z)
    }
    fun advance(dt:Float):Boolean {
        if(!dt.isFinite()||dt<=0f||route.isEmpty())return false
        stepTime+=dt.coerceAtMost(.25f)*15f
        var changed=false
        while(stepTime>=1f && route.isNotEmpty()){
            val point=route.removeFirst()
            check(walkable(point.first,point.second))
            x=point.first;z=point.second;walkedTiles++;stepTime-=1f;changed=true
        }
        if(changed && route.isEmpty())lastMessage="Arrived. Choose Interact."
        return changed
    }
    fun actionName(p:Place)=when(p.id){
        "cook"->when(stage){0->"Start Cook's Assistant";1->"Give the Cook the ingredients";else->"Talk to Cook"}
        "supplies"->"Take a pot and bucket"
        "egg"->"Pick up egg"
        "cow"->"Milk cow using bucket"
        "wheat"->"Harvest grain"
        "mill"->when(hopperStep){0->"Put grain into hopper";1->"Operate hopper controls";else->"Take flour in pot"}
        else->"Interact"
    }
    fun interact(id:String):Result {
        val p=places.find{it.id==id}?:return result(false,"Unknown location.")
        if(distance(p.x,p.z)>2)return result(false,"Walk closer to "+p.name+".")
        if(stage==2 && id!="cook")return result(false,"Quest already completed and saved.")
        return when(id){
            "cook"->when(stage){
                0->{stage=1;result(true,"Cook's Assistant started: egg, bucket of milk, pot of flour.")}
                1->if(has("Egg")&&has("Bucket of milk")&&has("Pot of flour")){
                    items["Egg"]=0;items["Bucket of milk"]=0;items["Pot of flour"]=0
                    stage=2;cookingXp+=300;questPoints+=1
                    result(true,"QUEST COMPLETE! 300 Cooking XP and 1 quest point.")
                }else result(false,"Cook still needs egg, bucket of milk and pot of flour.")
                else->result(true,"Cook's Assistant is already complete.")
            }
            "supplies"->{
                var added=false
                if(!has("Pot")&&!has("Pot of flour")){items["Pot"]=1;added=true}
                if(!has("Bucket")&&!has("Bucket of milk")){items["Bucket"]=1;added=true}
                result(added,if(added)"Collected kitchen pot and bucket." else "Supplies already carried.")
            }
            "egg"->if(stage==0)result(false,"Talk to Cook first.")
                else if(has("Egg"))result(false,"You already have an egg.")
                else{items["Egg"]=1;result(true,"Egg collected.")}
            "cow"->if(stage==0)result(false,"Talk to Cook first.")
                else if(has("Bucket of milk"))result(false,"Already carrying milk.")
                else if(!has("Bucket"))result(false,"Bring an empty bucket from the kitchen.")
                else{items["Bucket"]=0;items["Bucket of milk"]=1;result(true,"You milked the cow.")}
            "wheat"->if(stage==0)result(false,"Talk to Cook first.")
                else if(has("Grain")||has("Pot of flour")||hopperStep>0)
                    result(false,"You already gathered grain.")
                else{items["Grain"]=1;result(true,"Wheat picked; grain in inventory.")}
            "mill"->{
                if(stage==0)return result(false,"Talk to Cook first.")
                when(hopperStep){
                    0->if(!has("Grain"))result(false,"Get wheat from the field first.")
                       else{items["Grain"]=0;hopperStep=1;result(true,"Grain placed in hopper.")}
                    1->{hopperStep=2;result(true,"Hopper operated. Flour is ready.")}
                    2->if(!has("Pot"))result(false,"Bring a pot from the kitchen.")
                       else{items["Pot"]=0;items["Pot of flour"]=1;hopperStep=3
                           result(true,"Pot filled with flour.")}
                    else->result(false,"Flour already collected.")
                }
            }
            else->result(false,"Nothing happens.")
        }
    }
    fun save():String{
        val fields=mutableListOf(FORMAT,x.toString(),z.toString(),stage.toString(),
            cookingXp.toString(),questPoints.toString())
        ITEMS.forEach{fields.add((items[it]?:0).toString())}
        fields.add(hopperStep.toString());fields.add(walkedTiles.toString())
        val payload=fields.joinToString("|")
        val crc=CRC32().apply{update(payload.toByteArray())}.value
        return payload+"|"+crc
    }
}

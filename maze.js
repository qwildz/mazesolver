
    var canvas = document.getElementById("mazecanvas");
    var context = canvas.getContext("2d");

    var aa = 1;
    var maze_img_src;

    var playGameRuntime, isPlaying, gameSolved;

    var playerColor = "#0000FF",
        stepColor = "#9999FF",
        backtrackColor = "#000099";


    var mazeWidth = 570;
    var mazeHeight = 570;
    var pathWidth = 10;
    var pathHeight = 10;
    var wallWidth = 10;
    var wallHeight = 10;
    var nPathX = 28;
    var nPathY = 28;

    var intervalVar;

    var currRectX, currRectY;
    var newX = currRectX;
    var newY = currRectY;
    var oldX, oldY;

    var HADAP_ATAS = 0,
        HADAP_KIRI = 1,
        HADAP_KANAN = 2,
        HADAP_BAWAH = 3;
    var menghadap, tempMenghadap;

    var MAJU_KANAN = 0,
        MAJU_KIRI = 1,
        MAJU_ATAS = 2,
        MAJU_BAWAH = 4;
    var ARAH_MAJU = [MAJU_KANAN, MAJU_KIRI, MAJU_ATAS, MAJU_BAWAH];

    var BELUM_DIKUNJUNGI = 0,
        BARU_DIKUNJUNGI = 1,
        SUDAH_DIKUNJUNGI = 2;
    var arrayDikunjungi;
    var arrayLangkah;
    var nLangkahTotal;
    var backtrack;

    var t_start, t_end;

    /*________________________________________SETTING PERSIAPAN GAME______________________________________*/

    function inisialisasi(maze_src)
    {
        maze_img_src = maze_src;
        persiapanCatatanLangkah();
        gambarMaze();
    }

    function persiapanCatatanLangkah()
    {
        arrayDikunjungi = [];
        arrayLangkah = [];
        nLangkahTotal = 0;

        var totalx = nPathX*2 + 1;
        var totaly = nPathY*2 + 1;

        for(var i = 0; i < totalx; i++)
        {
            arrayDikunjungi[i] = new Array(totaly);

            for(var j = 0; j < totaly; j++)
                arrayDikunjungi[i][j] = 0;
        }
    }

    function persiapanPemain()
    {
        var startPos = getPositionFromColor(context, [0, 0, 255]);
        gameSolved = false;

        setPosisiPlayer(startPos[0], startPos[1], playerColor);
        setStatusKunjungi(currRectX, currRectY, BARU_DIKUNJUNGI);
    }

    function gambarMaze()
    {
        makeWhite(0, 0, canvas.width, canvas.height);

        var mazeImg = new Image();

        mazeImg.onload = function ()
        {
            context.drawImage(mazeImg, 0, 0);
            persiapanPemain();
        };
        mazeImg.src = maze_img_src;
    }

    function gambarSolusi()
    {
        makeWhite(0, 0, canvas.width, canvas.height);

        var mazeImg = new Image();

        mazeImg.onload = function ()
        {
            context.drawImage(mazeImg, 0, 0);
            
            var n = 0;
            for(var i = 0; i < arrayLangkah.length; i++) {
                gambarKotak((arrayLangkah[i][0])*pathWidth, (arrayLangkah[i][1])*pathWidth, pathWidth, pathHeight, playerColor);
                n++;
            }
        };
        mazeImg.src = maze_img_src;
    }

    /*_____________________________________GAME DIMULAI_________________________________________*/

    function setPosisiPlayer(x, y)
    {
        if(!gameSolved && isPlaying)
        {
            context.beginPath();
            context.rect(currRectX, currRectY, 10, 10);
            context.closePath();
            context.fillStyle = backtrack ? backtrackColor : stepColor;
            context.fill();
        }

        context.beginPath();
        context.rect(x, y, pathWidth, pathHeight);
        context.closePath();
        context.fillStyle = playerColor;
        context.fill();

        currRectX = x;
        currRectY = y;
    }

    function cekTembok(destX, destY)
    {
        var imgData = context.getImageData(destX, destY, pathWidth, pathHeight);
        var data = imgData.data;
        
        var tembok = false;
        if (destX >= 0 && destX <= mazeWidth && destY >= 0 && destY <= mazeHeight)
        {
            for (var i = 0; i < 4 * pathWidth * pathHeight; i += 4)
            {
                if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0)
                {
                    tembok = true; // 0 means: the rectangle can't move
                    break;
                }
                else if (data[i] === 0 && data[i + 1] === 255 && data[i + 2] === 0)
                {
                    tembok = 2;
                    break;
                }
            }
        }
        else {
            tembok = true;
        }

        return tembok;
    }

    function bisaJalan(x, y)
    {
        if(!telahDikunjungi(x, y) || backtrack)
        {
            var tembok = cekTembok(x, y);
            if(!tembok && statusKunjungi(x, y) != SUDAH_DIKUNJUNGI)
                return true;
            else if(tembok === 2)
                return 2;
        }
        else
            return false;
    }

    /*_____________________________________GRAFIS GAME__________________________________________*/

    function gambarKotak(x, y, w, h, color)
    {
        context.beginPath();
        context.rect(x, y, w, h);
        context.closePath();
        context.fillStyle = color;
        context.fill();
    }

    function makeWhite(x, y, w, h)
    {
        gambarKotak(x, y, w, h, "#FFFFFF");
    }

    function getPositionFromColor(ctx, color)
    {
        var w = ctx.canvas.width,
            h = ctx.canvas.height,
            data = ctx.getImageData(0, 0, w, h),
            buffer = data.data,
            len = buffer.length,
            x, y = 0, p, px;

        for(;y < h; y++) {
            p = y * 4 * w;
            for(x = 0; x < w; x++) {

                px = p + x *4;
                
                if (buffer[px] === color[0]) {
                    if (buffer[px + 1] === color[1] &&
                        buffer[px + 2] === color[2]) {
                    
                        return [x, y];
                    }
                }
            }
        }
        return null;
    }

    /*___________________________________PENCATATAN LANGKAH_________________________________*/

    function setStatusKunjungi(x, y, status)
    {
        arrayDikunjungi[(x/pathWidth)][(y/pathHeight)] = status;
    }

    function telahDikunjungi(x, y)
    {
        return arrayDikunjungi[(x/pathWidth)][(y/pathHeight)] !== BELUM_DIKUNJUNGI;
    }

    function statusKunjungi(x, y)
    {
        return arrayDikunjungi[(x/pathWidth)][(y/pathHeight)];
    }

    function simpanLangkah()
    {
        arrayLangkah.push([currRectX/pathWidth, currRectY/pathHeight]);
    }

    function buangLangkah()
    {
        arrayLangkah.pop();
    }

    /*______________________________________PEMECAHAN SOLUSI LABIRIN_________________________________*/

    function solveMaze()
    {
        if(gameSolved)
        {
            gameSelesai();
            return true;
        }
        else
        {
            var melangkah = false;

            for(var i = 0; i < ARAH_MAJU.length; i++)
            {
                switch (ARAH_MAJU[i])
                {
                    case MAJU_ATAS:
                        newX = currRectX;
                        newY = currRectY - pathHeight;
                    break;
                    
                    case MAJU_KIRI :
                        newX = currRectX - pathWidth;
                        newY = currRectY;
                    break;
                    
                    case MAJU_KANAN :
                        newX = currRectX + pathWidth;
                        newY = currRectY;
                    break;

                    case MAJU_BAWAH :
                        newX = currRectX;
                        newY = currRectY + pathWidth;
                    break;
                }

                var bisa_jalan = bisaJalan(newX, newY);
            
                if(bisa_jalan == 2)
                {
                    melangkah = true;
                    gameSolved = true;
                    break;
                }
                else if(bisa_jalan == 1)
                {
                    melangkah = true;
                    break;
                }
            }

            if(melangkah)
            {
                oldX = currRectX;
                oldY = currRectY;

                if(backtrack) {
                    buangLangkah();
                } else {
                    simpanLangkah();
                }

                nLangkahTotal++;

                setPosisiPlayer(newX, newY);
                
                if(statusKunjungi(newX, newY) == BARU_DIKUNJUNGI)
                    setStatusKunjungi(oldX, oldY, SUDAH_DIKUNJUNGI);

                setStatusKunjungi(newX, newY, statusKunjungi(newX, newY) + 1);

                if(statusKunjungi(oldX, oldY) == SUDAH_DIKUNJUNGI && statusKunjungi(newX, newY) == BARU_DIKUNJUNGI)
                    setStatusKunjungi(oldX, oldY, BARU_DIKUNJUNGI);

                menghadap = tempMenghadap;

                backtrack = false;

                return true;
            }
            else
            {
                if(backtrack)
                {
                    console.log("NO SOLUTION!");
                    return false;
                }

                backtrack = true;

                return false;
            }
        }
    }

    function gameMulai()
    {
        isPlaying = true;
        t_start = new Date();
        playGameRuntime = setInterval(function () {
            solveMaze();
        }, 0);

        resetStatus();
    }

    function gameSelesai()
    {
        isPlaying = false;
        simpanLangkah();

        clearInterval(playGameRuntime);

        gambarSolusi();

        tulisStatus();
    }

    /*______________________________________CONTROL GAME_________________________________*/
    var tombol = document.getElementById("playGameButton");
    var level = document.getElementById("levelSelect");

    var statusLangkah = document.getElementById("resultLangkah");
    var statusTime = document.getElementById("resultTime");
    var statusTotal = document.getElementById("resultTotal");

    tombol.addEventListener("click", function() {
        if(!isPlaying)
            gameMulai();
    }, true);

    level.addEventListener("change", gantiLevel, false);
    level.addEventListener("keypress", gantiLevel, false);
    level.addEventListener("paste", gantiLevel, false);
    level.addEventListener("input", gantiLevel, false);


    function gantiLevel()
    {
        isPlaying = false;
        clearInterval(playGameRuntime);
        var n = level.value;
        inisialisasi("maze/" + n + ".png");
    }

    function resetStatus()
    {
        statusLangkah.innerHTML = 0;
        statusTime.innerHTML = 0 + 'm ' + 0 + 'ss ' + 0 + 'ms';
        statusTotal.innerHTML = 0;
    }

    function tulisStatus()
    {
        t_end = new Date();
        t_end.setDate(t_end.getDate() + 1);

        var msec = t_end - t_start;
        var hh = Math.floor(msec / 1000 / 60 / 60);
        msec -= hh * 1000 * 60 * 60;
        var mm = Math.floor(msec / 1000 / 60);
        msec -= mm * 1000 * 60;
        var ss = Math.floor(msec / 1000);
        msec -= ss * 1000;

        statusLangkah.innerHTML = arrayLangkah.length;
        statusTime.innerHTML = mm + 'm ' + ss + 's ' + msec + 'ms';
        statusTotal.innerHTML = nLangkahTotal;

    }

    inisialisasi("maze/1.png");
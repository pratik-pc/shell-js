const child_process = require('child_process');
const readline = require('readline');
const { stdin: input, stdout: output } = require('node:process');
const rl = readline.createInterface(input,output);
const user = require('os').userInfo().username

//check platform
var isWin = process.platform === "win32"

//Windows command compatibility
var winCommands = {
    "ls": "dir",
    "pwd": "cd",
    "fg": "start"
}

console.log('Welcome to Node Shell, \n(c) Pratik Chanda')

if (!isWin) {
    winCommands["ls"] = "ls"
    winCommands["pwd"] = "pwd"
}


//latest ongoing process
var fg_pid = undefined


//default directory
process.chdir(`/Users/${user}`)
console.log(`Shell opened at directory: ${process.cwd()}`)


rl.on('line', function(line) {
    //parse commands
    var command = line.split(" ").filter(element=>element)
    var cmd = command[0]
    var args = []
    if (command.length > 2) {
        for (var i = 1; i < command.length; i++) {
            args.push(command[i])
        }
    }


    switch(cmd) {
        //shell exit
        case "exit":
            rl.close()
            break;


        //change directory
        case "cd": {
            try {
                process.chdir(`${command[1]}`)
                console.log(`New directory: ${process.cwd()}`)
            } catch (err) {
                console.error(`${err}`)
            }
            break;

        }

        case "fg": {
            var subprocess = child_process.spawn(`${winCommands['fg']}`, args)
            subprocess.stdout.on('data', (data) => {
                console.log(`std: ${data}`)
            })
            subprocess.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`)
            })
            subprocess.on('error', (err) => {
                console.log(`error: ${err.message}`)
            })
            fg_pid = subprocess.pid
            break;
        }


        //list directories
        case "ls": {
            if (command.length == 1) {
              command[1] = ""
            }
            var ls = child_process.exec(`${winCommands["ls"]} ${command[1]}`, (error, stdout, stderr) => {
                if (error) {
                    console.log(error.message)
                }
                if (stderr) {
                    console.log(stderr)
                }
                console.log(stdout)
                })
            fg_pid = ls.pid
            break;
        }


        case "pwd": {
          var pwd = child_process.exec(`${winCommands['pwd']}`, (error, stdout, stderr) => {
            if (error) {
              console.log(error)
            }
            if (stderr) {
              console.log(stderr)
            }
            console.log(stdout)
          })
          fg_pid = pwd.pid
          break;
        }
        
        default: {
            
            var subprocess = child_process.spawn(`${cmd}`, args)
            subprocess.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`)
            })
            subprocess.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`)
            })
            subprocess.on('error', (err) => {
                console.log(`error: ${err.message}`)
            })
            /*
            var subprocess = child_process.exec(`${cmd}`,args , (error, stdout, stderr) => {
                if (error) {
                    console.log(error.message)
                    return;
                }
                if (stderr) {
                    console.log(stderr.message)
                    return;
                }
                console.log(stdout)
            }) */
            fg_pid = subprocess.pid
            break;

        }

    }
   


})


rl.on('SIGINT', ()=>{
    try {
        process.kill(fg_pid, 'SIGINT')
        console.log(`child process with pid ${fg_pid} closed`)
    } catch (error) {
        rl.close()
    }
})




//custom ctrl+z for windows
process.stdin.on('keypress', function(c,k) {
    if(isWin) {
        if (k.name == "z" && k.ctrl == true) {
            try {
                process.kill(fg_pid, 'SIGTSTP')
                child_process.exec(`start /b ${fg_pid}`)
                console.log(`process with pid ${fg_pid} moved to background`)
            } catch (error) {
                console.log('No child process is running currently!')
            }
        }
    }
})




rl.on('SIGTSTP', () => {

    try {
        process.kill(fg_pid, 'SIGTSTP')
        child_process.exec(`bg ${fg_pid}`)
        console.log(`process with pid ${fg_pid} moved to background`)
    } catch (error) {
        console.log('No child process is running currently!')
    }
})



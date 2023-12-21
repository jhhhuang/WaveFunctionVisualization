import json
import threading

import numpy as np
from scipy import sparse
from scipy.sparse.linalg import expm
import asyncio
import websockets


class bwpThread(threading.Thread):
    def __init__(self, websocket, U0, a, pw, E0):
        threading.Thread.__init__(self)
        self.websocket = websocket
        self.U0 = U0
        self.a = a
        self.pw = pw
        self.E0 = E0
        self.should_stop = False

    def run(self):
        asyncio.set_event_loop(asyncio.new_event_loop())
        loop = asyncio.get_event_loop()
        loop.run_until_complete(
            bwp(self.websocket, self.U0, self.a, self.pw, self.E0, self))

    def stop(self):
        self.should_stop = True


class andersonThread(threading.Thread):
    def __init__(self, websocket, disorder_strength):
        threading.Thread.__init__(self)
        self.websocket = websocket
        self.disorder_strength = disorder_strength
        self.should_stop = False

    def run(self):
        asyncio.set_event_loop(asyncio.new_event_loop())
        loop = asyncio.get_event_loop()
        loop.run_until_complete(
            anderson(self.websocket, self.disorder_strength,self))

    def stop(self):
        self.should_stop = True


async def time_evolution_operator(x, t, V):
    dx = x[1] - x[0]
    dt = t[1] - t[0]
    lenx = len(x)

    e = np.ones(lenx)
    Lap = sparse.spdiags([-2 * e, e, e], [0, -1, 1], lenx, lenx) / dx ** 2
    Vmat = sparse.spdiags(V, 0, lenx, lenx)
    H = -1 / 2 * Lap + Vmat

    A = expm(-1j * H * dt)
    return A.toarray()


async def bwp(websocket, U0, a, pw, E0, thread):
    t = np.linspace(0, 20, 1000)
    Lw = a * pw
    x = np.linspace(-40, 40, 2000)
    potentialV = np.heaviside(x, 1) * np.array([0 if xx %
                                                a <= Lw and xx % a > 0 else U0 for xx in x])

    potentialV[0] = 1000
    potentialV[-1] = 1000

    u_opt = await time_evolution_operator(x, t, potentialV)

    # initial Gaussian wavepacket
    k0 = np.sqrt(2*E0)
    xi = -20
    w0 = 10
    u0 = np.exp(1j * k0 * x - (x - xi) ** 2 / (w0 ** 2))

    dx = x[1] - x[0]
    u0 = u0 / np.sqrt(np.sum(np.abs(u0) ** 2) * dx)

    u = u0

    # data for plotting potential
    potentialplt = np.abs(potentialV)[1:-1] / np.abs(U0)
    potential_x = x[1:-1]

    line2 = []
    for j in range(len(potential_x)):
        line2.append([potential_x[j], potentialplt[j]])

    # iteration
    for i in range(len(t)):
        # check whether the stop message is sent
        if thread.should_stop:
            break

        ui = np.matmul(u_opt, u)
        u = ui
        u2 = np.abs(ui) ** 2

        line1 = []
        for j in range(len(x)):
            line1.append([x[j], u2[j]])

        data = {
            'line1': line1,
            'line2': line2,
            'title': "t={:.2f}".format(t[i])
        }

        # send data
        await websocket.send(json.dumps(data))

        # sleep 0.02s
        await asyncio.sleep(0.02)


async def anderson(websocket, disorder_strength, thread):
    t = np.linspace(0, 20, 1000)
    U0 = 10
    a = 2
    pw = 0.5
    Lw = a * pw
    E0 = 8
    L = 80
    N = 2000

    x = np.linspace(-L/2, L/2, N)
    potentialV = np.array([0 if xx %
                           a <= Lw and xx % a > 0 else U0 for xx in x])

    # disordered potential with Gaussian distribution
    disorder_scale = 2*U0-1.8*disorder_strength*U0
    gaussian_potential_height = np.random.normal(
        loc=U0, scale=U0/disorder_scale, size=10*int(L/a)+1)

    height_idx = 0
    if x[0] % a <= Lw and x[0] % a > 0:
        disordered_potential = [0]
        flag = [0]
    else:
        disordered_potential = [gaussian_potential_height[0]]
        flag = [1]

    for i in range(1, len(x)):
        if x[i] % a <= Lw and x[i] % a > 0:
            flag.append(0)
            disordered_potential.append(0)

        else:
            flag.append(1)
            if flag[i] != flag[i-1]:
                height_idx += 1
            while gaussian_potential_height[height_idx] < 0:
                height_idx += 1
            disordered_potential.append(gaussian_potential_height[height_idx])

    potentialV[0] = 1000
    potentialV[-1] = 1000

    disordered_potential[0] = 1000
    disordered_potential[-1] = 1000

    u_opt = await time_evolution_operator(x, t, potentialV)
    u_opt2 = await time_evolution_operator(x, t, disordered_potential)

    # initial Gaussian wavepacket
    k0 = np.sqrt(2*E0)
    xi = -20
    w0 = 7
    u0 = np.exp(1j*k0*x-(x-xi)**2/(w0**2))

    # normalize
    dx = x[1]-x[0]
    u0 = u0 / np.sqrt(np.sum(np.abs(u0)**2)*dx)

    u = u0
    u2 = u0

    # data for plotting potential
    potential_x = x[1:-1]
    potentialplt = np.abs(potentialV)[1:-1] / np.abs(U0)
    disordered_potentialplt = np.abs(disordered_potential)[
        1:-1]/np.max(disordered_potential[1:-1])

    line3 = []
    line4 = []
    for j in range(len(potential_x)):
        line3.append([potential_x[j], potentialplt[j]])
        line4.append([potential_x[j], disordered_potentialplt[j]])

    # iteration
    for i in range(len(t)):
        # check whether the stop message is sent
        if thread.should_stop:
            break

        ui = np.matmul(u_opt, u)
        ui2 = np.matmul(u_opt2, u2)
        u = ui
        u2 = ui2

        ui_2 = np.abs(ui)**2
        ui2_2 = np.abs(ui2)**2
        line1 = []
        line2 = []
        for j in range(len(x)):
            line1.append([x[j], ui_2[j]])
            line2.append([x[j], ui2_2[j]])

        data = {
            "line1": line1,
            "line2": line2,
            "line3": line3,
            "line4": line4,
            "title": "t={:.2f}".format(t[i])
        }

        # send data
        await websocket.send(json.dumps(data))

        # sleep 0.02s
        await asyncio.sleep(0.02)


async def serve(websocket, path):
    threads1 = []
    threads2 = []

    async for message in websocket:
        message_dit = json.loads(message)
        r_plot = message_dit['plot']
        if r_plot == 'bwp':
            r_type = message_dit['type']

            if r_type == "start":
                r_U0 = message_dit['U0']
                r_a = message_dit['a']
                r_pw = message_dit['pw']
                r_E0 = message_dit['E0']

                # stop all running threads
                for thread in threads1:
                    if thread.is_alive():
                        thread.stop()

                # start an new thread
                thread = bwpThread(websocket, r_U0, r_a, r_pw, r_E0)
                thread.start()
                threads1.append(thread)

            elif r_type == "stop":
                # stop all running threads
                for thread in threads1:
                    if thread.is_alive():
                        thread.stop()
        elif r_plot == 'anderson':
            r_type2 = message_dit['type2']

            if r_type2 == 'start':
                r_ds = message_dit['disorder_strength']

                # stop all running threads
                for thread in threads2:
                    if thread.is_alive():
                        thread.stop()

                # start an new thread
                thread = andersonThread(websocket, r_ds)
                thread.start()
                threads2.append(thread)

            elif r_type2 == "stop":
                # stop all running threads
                for thread in threads2:
                    if thread.is_alive():
                        thread.stop()


if __name__ == "__main__":
    start_server = websockets.serve(serve, "localhost", 8888)

    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()

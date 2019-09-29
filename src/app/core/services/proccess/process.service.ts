import { Injectable } from '@angular/core';
import { ElectronService } from '../electron/electron.service';
import { Proccess, ProcessType } from '../../model/process';
import { App } from '../../model/app.model';
import { FlatpakProcess } from '../../model/flatpak-process';
import { EventBusService } from 'ngx-eventbus';

@Injectable({
    providedIn: "root"
})
export class ProcessService {

    processQueue: Proccess[] = []
    processServiceState = ProcessServiceState.IDLE

    constructor(
        private electronService: ElectronService,
        private eventBusService: EventBusService
    ) { }

    install(app: App) {
        if (!this.electronService.isElectron) return

        switch (app.type) {
            case 'Flatpak':
                this.addFlatpakProcessToQueue(app, ProcessType.INSTALL)
                break
            default:
                console.log(`This app cannot install ${app.type} yet`)
        }

        this.onQueueModified()
    }

    private onQueueModified() {
        if (this.processQueue.length > 0) {
            this.processQueue[0].start()
        } else {
            console.log('Empty queue')
        }
    }

    addFlatpakProcessToQueue(app: App, processType: ProcessType) {
        const process = new FlatpakProcess(
            this.onProcessFinished.bind(this),
            app,
            processType,
            this.electronService
        )
        this.processQueue.push(process)
    }

    onProcessFinished(app: App) {
        this.processQueue.shift()
        this.onQueueModified()
        this.eventBusService.triggerEvent(app._id, app)
    }
}

enum ProcessServiceState {
    BUSY,
    IDLE
}

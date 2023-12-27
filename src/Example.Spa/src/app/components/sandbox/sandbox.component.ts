import { Component, EventEmitter, OnInit } from '@angular/core';
import { SandboxService } from '../../services/sandbox.service';
import { FlowService } from '../../services/flow.service';
import { catchError, first, merge, of, switchMap } from 'rxjs';
import { FailureService } from '../../services/failure.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-sandbox',
  templateUrl: './sandbox.component.html',
  styleUrl: './sandbox.component.scss'
})
export class SandboxComponent implements OnInit {
  showMoreHelp = false;
  sandboxId = 123;

  generateSandboxEvent = new EventEmitter<boolean>;
  output: string[] = [];

  resources = ['sql', 'redis'];
  circuit: { [key: string]: string; } = {};
  status: { [key: string]: string } = {};




  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sandboxService: SandboxService,
    private flowService: FlowService,
    private failureService: FailureService,

  ) {

    this.resources.forEach(r => {
      this.circuit[r] = 'operational';
      this.status[r] = '200 OK';
    })

  }

  ngOnInit(): void {
    this.sandboxId = (this.route.snapshot.params as any).sandboxId;

    merge(this.generateSandboxEvent)
      .pipe(
        switchMap(() => this.sandboxService.get()),
        catchError((e) => {
          console.log(e)
          return of({});
        }
        ))
      .subscribe((response: any) => {

        const sandboxId = response.value;

        if (sandboxId) {
          window.location.href = `/sandbox/${sandboxId}`;
        }
      })


    if (!this.sandboxId) {

      this.generateSandboxEvent.next(true);

    }
    else {
      //sandbox ready to use
      this.terminalLog('Sandbox ready');
    }
  }

  terminalLog(message: string) {
    this.output.push(`>>> ${message}`);
  }

  regenerateSandbox() {
    this.generateSandboxEvent.next(true);
  }




  toggle(resource: string) {
    switch (this.circuit[resource]) {
      case 'operational':
        this.failureService.eject(resource);
        this.circuit[resource] = 'unavailable';
        this.terminalLog(`${resource} switched to 'unavailable'`);
        break;
      case 'unavallable':
      default:
        this.failureService.inject(resource);
        this.circuit[resource] = 'operational';
        this.terminalLog(`${resource} switched to 'operational'`);
        break;
    }
  }

  run(resource: string) {
    this.flowService.execute(resource).pipe(
      first(),

    ).subscribe(output => {

      this.status[resource] = output;
    });
  }

  visualize() {

  }

  clone() {

  }
}
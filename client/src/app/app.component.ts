import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',   //the main app-root that inside the index.html
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Skinet';
  

  constructor() {}

  ngOnInit(): void {

  }
}
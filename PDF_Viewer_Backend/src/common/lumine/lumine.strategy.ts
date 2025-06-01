import { Strategy } from 'passport-jwt';
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";

@Injectable()
export class LumineStrategy extends PassportStrategy(Strategy) {
    
}